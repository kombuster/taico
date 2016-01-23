'use strict';
const chalk = require('chalk');
const path = require('path');
const assert = require('assert');
const ModuleUnderTest = require('./module-under-test');
const fs = require('fs');

class TestRunner {
	constructor(modules, testsDir){
		this.testsDir = testsDir;
		this.testModules = [];
		for(var module in modules) {
			var methods = modules[module];
			var testModule = { name: module, methods:[], pathToTest: path.join(testsDir, module, '.js') };

			for(var method in methods) {
				if (method === 'underTest') {
					continue;
				}
				testModule.methods.push({name:method, func: methods[method] });
			}

			var sut = methods['underTest'];
			assert(sut, module +': module under test must be specified');
			testModule.underTest = new ModuleUnderTest(sut, testsDir);
			this.testModules.push(testModule);
		}

	}

	run() {
		for(var module of this.testModules) {
			console.log(chalk.green(module.name));
			var instance = module.underTest.create();
			for (var method of module.methods) {
				try {
					method.func(instance);
					console.log(chalk.green('--' + method.name));
				} catch(e) {
					console.log(chalk.red('--' + method.name));
					console.log(chalk.red('----' + e));
				}
			}
		}
		return this;
	}

	// watch() {
	// 	console.log('watching');
	// 	for(var module of this.testModules) {
	// 		// console.log(chalk.blue('--' + module.pathToTest));
	// 		// console.log(chalk.blue('--' + module.underTest.path));
	// 		fs.watchFile(module.pathToTest, (curr, prev) => {
				
	// 			this.run();
	// 		});

	// 		fs.watchFile(module.underTest.path, (curr, prev) => {
	// 			this.run();
	// 		});
	// 	}
	// 	return this;
	// }

}

module.exports = TestRunner;