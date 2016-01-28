'use strict';
const chalk = require('chalk');
const path = require('path');
const assert = require('assert');
const ModuleUnderTest = require('./module-under-test');
const fs = require('fs');
const glob = require('glob');
const chokidar = require('chokidar');


class TestRunner {
	constructor(testsDir){
		this.testsDir = testsDir;
	}

	load() {
		return new Promise((resolve,reject)=>{
			glob(this.testsDir, null, (err, files) => {
				if (err) {
					reject(err);
					return;
				}
				var testModules = [];
				for(let file of files) {
					//console.log(file);
					var moduleReference = require.resolve(file);
					if (moduleReference && require.cache[moduleReference]) {
						delete require.cache[moduleReference];
					}
					var testModule = { name: path.basename(file, '.js'), source: file, module: require(file), methods:[] };
					for(let method in testModule.module) {
						if (method === 'underTest') {
							continue;
						}
						testModule.methods.push({ name:method, func: testModule.module[method] });
					}
					var sut = testModule.module.underTest;
					assert(sut, 'module under test must be specified in ' + testModule.name);

					testModule.underTest = new ModuleUnderTest(sut, testModule.source);
					testModules.push(testModule);
				}
				resolve(testModules);
			});
		});
	}

	run(done, options) {
		var filter = { module: null, method: null};

		if (options && options.focus) {
			var split = options.focus.split('.');
			filter = { module: split[0], method: split[1] };
		}

		this.load()
		.then(testModules=>{
			var promiseChain = [];
			for(var module of testModules) {
				if (filter.module && filter.module != module.name) {
					continue;
				}
				for (var method of module.methods) {
					if (filter.method && filter.method != method.name) {
						continue;
					}
					promiseChain.push({ module, method, 
						run:function(){
							var self = this;
							return new Promise((resolve, reject)=>{
								console.log(chalk.yellow(self.module.name + '.' + self.method.name));
								var resultHandler = (e) => {
									if (e) {
										//console.log(chalk.red(e.stack));
										console.log(chalk.red('--' + self.method.name));
										console.log(chalk.red('----' + e));									
									} else {
										console.log(chalk.green('--OK--'));
									}
								};
								try{
									var result = self.method.func();
									if (result instanceof Promise) {
										result.then(()=>{
											resultHandler();
											resolve();
										})
										.catch(resultHandler);
									} else {
										resultHandler();
										resolve();
									}
								} catch(e) {
									resultHandler(e);
									resolve();
								}
							});
						}
					});
				}
			};

			return new Promise((resolve,reject)=>{
				var unitThen = (unit)=> {
					if (!unit) {
						resolve(testModules);
					} else {
						unit.run()
						.then(()=>{
							unitThen(promiseChain.shift());
						})
						.catch(e => {
							console.log('shit happened');
						});
					}
				};
				unitThen(promiseChain.shift());
			});
		})	
		.then(testModules=>{
			if (options && options.watch) {
				if (!this.watching) {
					var filesToWatch = [];
					testModules.forEach(module => {
						filesToWatch.push(module.source);
						filesToWatch.push(module.underTest.path);
					});
					chokidar.watch(filesToWatch).on('change', path => {
						console.log(path + ' changed');
						for(var module of testModules) {
							module.underTest.reload();						
						}
	  				this.run(done, options);
					});
					console.log('...standing by for changes...');
					this.watching = true;
				}
			} else {
				done();
			}
		});	
	}
}

module.exports = TestRunner;