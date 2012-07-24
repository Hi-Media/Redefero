// ==UserScript==
// @name        Redefero
// @namespace   https://indefero.hi-media-techno.com
// @include     https://indefero.hi-media-techno.com/*
// @version     1.6
// @downloadURL https://github.com/jibriss/Redefero/raw/master/redefero.user.js
// @updateURL   https://github.com/jibriss/Redefero/raw/master/redefero.meta.js
// ==/UserScript==

var $ = unsafeWindow.$;
var redmineApiKey = GM_getValue("redmine-api-key");

if (redmineApiKey) {
    // On regarde si y'a des liens "features" et on récup les ids
    $branches = $('#branch-list a[href*="feature"]');
    var regexp = new RegExp("/feature-([0-9]+)/");
    var ids = new Array();
    $branches.each(function() {
        var href = $(this).attr("href");
        var matches = regexp.exec(href);
        if (matches) {
            ids.push(matches[1]);
        }
    });
    
    // On ajoute les liens redmine
    // On ne peut pas le faire avant parceque, étrangement,
    // GM_xmlhttpRequest marche pas dans le each
    for(i in ids) {
        var id = ids[i];
        var subject = GM_getValue("redmine-subject-" + id);
        if (subject) {
            addLinkToFeature(id, subject);
        } else {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://redmine.hi-media-techno.com/issues/" + id + ".json?key=" + redmineApiKey,
                onload: function(response) {
                    var json = '';
                    eval("json = " + response.responseText);
                    var id = json.issue.id;
                    var subject = json.issue.subject;
                    addLinkToFeature(id, subject);
                    GM_setValue("redmine-subject-" + id, subject);
                }
            });
        }
    }
    
    function addLinkToFeature(id, subject) {
        var $link = $('#branch-list a[href*="feature-' + id + '"]');
        $link.after(' - <a target="_blank" href="https://redmine.hi-media-techno.com/issues/' + id + '" class="label">' + subject + "</a>");
    }
}

// On ajoute les liens "source" à coté des projets dans le menu
// On suppose qu'ils possèdent tous une branche "stable"
$sources = $('#project-list ul li a');
$sources.each(function() {
    var href = $(this).attr('href');
    $(this).after(' (<a href="' + href + 'source/tree/stable">Source</a>)');
});

function clearCache() {
    var key, values = GM_listValues();
    for (i in values) {
        key = values[i]
        if (key != "redmine-api-key") {
            GM_deleteValue(key);
        }
    }
}

//Option pour effacer les fichier cache, au cas où ca bug
GM_registerMenuCommand("Vider les données en cache", function() {
    clearCache()
    alert("Données en cache vidées. Faites F5 pour recharger la page.");
}, "c");

//Option pour changer la clef api
GM_registerMenuCommand("Changer la clef API redmine", function() {
    var redmineApiKey = prompt("Entrez la nouvelle clef Redmine");
    GM_setValue("redmine-api-key", redmineApiKey);
    clearCache();
    alert("Clef changée et données en cache vidées. Faites F5 pour recharger la page.");
}, "r");

// Tri des tags par ordre naturel (v1.1.10 > v1.1.9)
var tags = $("#tag-list li");
var sorted = tags.get().sort(function(a, b){
    a = $(a).find("a").text().substr(1).split('.');
    b = $(b).find("a").text().substr(1).split('.');
    if (a[0] != b[0]) {
        return b[0] - a[0];
    } else if (a[1] != b[1]) {
        return b[1] - a[1];
    } else {
        return b[2] - a[2];
    }
});
$("#tag-list").empty().append(sorted);
