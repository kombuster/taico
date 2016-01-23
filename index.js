'use strict';
const requireDir = require('require-dir');
const chalk = require('chalk');
const ModuleUnderTest = require('./module-under-test');
const TestRunner = require('./test-runner');


module.exports = {
	tests:function(dir) {
		console.log(chalk.green('looking for tests in ' + dir));
		var testModules = requireDir(dir);
		return new TestRunner(testModules, dir);
	}
};