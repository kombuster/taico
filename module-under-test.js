'use strict';
const fs = require('fs');
const assert = require('assert');
const path = require('path');

class ModuleUnderTest {
	constructor(ref, testPath) {
		if (!ref.path) {
			this.path = ref + '.js';
			this.buildWith = [];
		} else {
			this.path = ref.path + '.js';
			this.buildWith = ref.buildWith;
		}
		this.path = path.resolve(path.dirname(testPath), this.path);
		assert(fs.existsSync(this.path), 'module under test is not found at:' + this.path);
	}

	create() {
		var moduleReference = require.resolve(this.path);
		if (moduleReference && require.cache[moduleReference]) {
			delete require.cache[moduleReference];
		}
		var type = require(this.path);
		return new type(this.buildWith[0], this.buildWith[1], this.buildWith[2], this.buildWith[3], this.buildWith[5]);
	}
}

module.exports = ModuleUnderTest;