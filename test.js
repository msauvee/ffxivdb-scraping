
var fs = require('fs');
var scrap = require('./scrap');

scrap.scrapJobs(function(skills) {
    var filepath = 'skills.json';
    fs.writeFile(filepath, JSON.stringify(skills, null, 2), function(err){
        if (err) {
            console.log('unable to write file ' + filepath);
            return;
        }
        console.log('File successfully written! - Check your project directory for the skills.json file');
    })
});
