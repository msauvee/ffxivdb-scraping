var request = require('request');
var fs = require('fs');

var useCache = true;

var getSkillFile = function(id) {
    return 'cache/skill-' + id + '.json';
}

var getSkill = function(id, cb) {
    if (!useCache) {
        var url = 'http://api.xivdb.com/action/' + id;
        request(url, function (error, response, json) {
            if (!error && response.statusCode == 200) {
                // update cache
                fs.writeFile(getSkillFile(id), json, processSkill(json, cb));
            }
            else {
                console.log('Unable to gather skill data having id "'+ id + '"');
            }
        });
    } else {
        var data;
        try {
            data = fs.readFileSync(getSkillFile(id));
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.log('File ' + getSkillFile(id) + ' not found!');
                return;
            } else {
                throw e;
            }        
        }
        processSkill(data, cb);
    }    
}

var processSkill = function(json, cb) {
    if (json === undefined) {
        console.log('no contennt to analyse !!!');
        return;
    }

    var skill = JSON.parse(json);
    if (!useCache) {
        fs.writeFileSync(getSkillFile(skill.id), JSON.stringify(skill, null, 2));
    }
    cb(skill); 
}

var scrapSkill = function(id, cb) {
    getSkill(id, cb);
}

var getJobFile = function(jobId) {
    return 'cache/skills-' + jobId + '.json';
}

var getJob = function(jobId, skills, cb) {
    if (!useCache) {
        var url = 'http://api.xivdb.com/search?by=main.level&classjobs=' + jobId + '&one=actions&order=DESC&where=AND&language=en'
        request(url, function (error, response, json) {
            if (!error && response.statusCode == 200) {
                // update cache
                fs.writeFileSync(getJobFile(jobId), json, processJob(jobId, skills, json, cb));
            }
            else {
                console.log('Unable to gather skill data for job "'+ jobId + '"');
            }
        });
    } else {
        var data;
        try {
            data = fs.readFileSync(getJobFile(jobId));
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.log('File ' + getJobFile(jobId) + ' not found!');
            } else {
                throw e;
            }        
        }
        processJob(jobId, skills, data, cb);
    }
}

// will be used to iterate recursively over skills asynchrsounously
// Only on the last one we call the callbask
var processIds = function(ids, skills, cb) {
    var id = ids.pop();
    if (ids.length > 0) {
        scrapSkill(id, function(skill) {
            skills.push(skill);
            processIds(ids, skills, cb);
        });
    } else {
        scrapSkill(id, function(skill) {
            skills.push(skill);
            if (cb) {
                cb(skills);
            }
        });
    }
}


var processJob = function(jobId, skills, json, cb) {
    if (json === undefined) {
        console.log('no content to analyse !!!');
        return;
    }

    // tooltips to parse are in a div having class 'search_result_box'
    var response = JSON.parse(json);
    if (!response.actions.results) {
        console.info('no content to analyse for job ' + jobId);
    }

    // gather ids of skills
    var ids = [];
    for (var i = 0; i < response.actions.results.length; i++) {
        ids.push(response.actions.results[i].id);
    }

    processIds(ids, skills, cb);
}

var scrapJob = function(jobId, skills, cb) {
    console.log('scrapping job having id ' + jobId);
    return getJob(jobId, skills, cb);
}

var scrapsJobsRecursively = function(id, skills, cb) {
    scrapJob(id, skills, function() {
        // 33 is the highest jobId
        if (id === 33) {
            cb(skills);
        } else  {
            scrapsJobsRecursively(id + 1, skills, cb);
        }
    })
}

var scrapJobs = function(cb) {
    //scrap from 1 to 33
    var skills = [];
    return scrapsJobsRecursively(1, skills, cb);
}


exports.scrapJobs = scrapJobs;