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
		this.load()
		.then(testModules=>{

			for(var module of testModules) {
				console.log(chalk.green(module.name));
				for (var method of module.methods) {
					try {
						console.log(chalk.yellow('--' + method.name));
						method.func();
						console.log(chalk.green('--OK--'));
					} catch(e) {
						console.log(chalk.red(e.stack));
						console.log(chalk.red('--' + method.name));
						console.log(chalk.red('----' + e));
					}
				}
			}
		

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