'use strict';
const chalk = require('chalk');
const ModuleUnderTest = require('./module-under-test');
const TestRunner = require('./test-runner');


module.exports = {
	tests:function(dir) {
		console.log(chalk.green('looking for tests in ' + dir));
		return new TestRunner(dir);
	}
};