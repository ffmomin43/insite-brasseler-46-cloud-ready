/// <binding ProjectOpened='watch' />
module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        sass: {
            options: {
                style: "expanded",
                compass: true
            },

            webThemes: {
                files: [{
                    expand: true,
                    src: "themes/**/*.scss",
                    ext: ".css"
                }]
            },

            webStyles: {
                files: [{
                    expand: true,
                    src: "styles/*.scss",
                    ext: ".css"
                }]
            }
        },

        watch: {
            webThemes: {
                files: "themes/**/*.scss",
                tasks: ["sass:webThemes"]
            },

            webStyles: {
                files: "styles/*.scss",
                tasks: ["sass:webStyles"]
            }
        }
    });

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", [
        "sass:webStyles",
        "sass:webThemes"
    ]);
};