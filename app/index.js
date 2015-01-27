'use strict';

var
  generators = require('yeoman-generator'),
  tasksList  = require('./tasksList.json'),
  fs         = require('fs');

module.exports = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);
    this.argument('appName', { type: String, required: false });
    this.argument('taskName', { type: String, required: false });
    this.appName = this._.camelize(this.appName);
    this.option('force');
  },

  prompting: function () {
    var done = this.async();

    var prompts =  [{
      type: 'checkbox',
      name: 'tasksList',
      message: 'Choose your tasks to add in your gulpfile.js',
      choices: tasksList
    }];

    this.prompt(prompts, function (answers) {
      this.taskAdding = answers.tasksList;
      done();
    }.bind(this));
  },

  configuring : function () {
    //this.npmInstall(['lodash'], { 'saveDev': true });
  },

  writing : {
    gulpfile : function () {
      //this.copy('_index.html', 'src/index.html');
      //this.mkdir('app');
      //var gulpfile = this.destinationRoot() + '/gulpfile.js';

      var dependencies = {};

      function setDep(depToSet) {
        depToSet.map(function (dep) {
          dependencies[dep] = '*';
        });
      }

      if (this.options.force) {
        fs.writeFile('gulpfile.js', '');
      }

      for (var i = 0; i < tasksList.length; i++) {
        var name = tasksList[i].name;
        if(this.taskAdding.indexOf(name) >= 0){
          var stream = this.read('../tasks/' + name + '.template');
          setDep(tasksList[i].dep);
          fs.appendFile('gulpfile.js', stream + "\n");
        }
      }

      this.dependencies = dependencies;
    },

    packageJson: function() {
      this.log(2);
      this.log(this.dependencies);
      var packageJson = {
        name: this._.slugify(this.appname),
        version: "0.0.0",
        description: "",
        author: "Martin Franck <franck.martin12@hotmail.com>",
        main: "gulpfile.js",
        dependencies: {},
        devDependencies: this.dependencies
      };

      this.write('package.json', JSON.stringify(packageJson, null, 2));
    }

  },

  install : function () {
   /* this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });*/
  },

  end : function () {

  }

});