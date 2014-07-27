{
	"translatorID": "2f52234a-9860-4048-863d-8f28563c133f",
	"label": "Google Code Issues",
	"creator": "Alex<blog.alexpsy.com>",
	"target": "^https?://code.google.com",
	"minVersion": "1.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsib",
	"lastUpdated": "2014-07-25 23:44:58"
}

/*
   Issue Page in Google Code Translator
   Copyright (C) 2014 Alex, alex@alexpsy.com & http://blog.alexpsy.com

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// #######################
// ##### Sample URLs #####
// #######################

/*
 * The starting point for an search is the URL below.
 * In testing, I tried the following:
 *
 *   - A Google Code Project Issue page
 *   - A search listing of issues
 */
// Useage: http://code.google.com

// #################################
// #### Local utility functions ####
// #################################

function trimTags(text) {
	return text.replace(/(<.*?>)/g, "");
}

function trimMultispace(text) {
	return text.replace(/\n\s+/g, "\n");
}

// #############################
// ##### Scraper functions #####
// ############################# 

function scrapeAndParse(doc, url) {
Zotero.Utilities.HTTP.doGet(url, function(page){
//	Z.debug(page)
	var pattern;
	
	//declare
	var itemType = "forumPost";
	var newItem = new Zotero.Item(itemType);
	cleanurl = url.slice(0,url.indexOf("\&"));
	newItem.url = cleanurl;
//	Z.debug(url);

	newItem.language = doc.documentElement.lang;
	
	//Title
	var titleXPath = '//span[@class="h3"]';
	var title = ZU.xpathText(doc, titleXPath);
//	Z.debug("title: "+title);
	newItem.title = Zotero.Utilities.trim(trimTags(title));
	
	//Author
	var authorXPath = '//div[@id="hc0"]/div/a';
	var author = ZU.xpathText(doc, authorXPath);
	newItem.creators.push(Zotero.Utilities.cleanAuthor(author,"author"));
//	Z.debug("Author: "+author);
	
	//Date
	var dateXPath = '//div[@id="hc0"]/div/span';
	var date = ZU.xpathText(doc, dateXPath);
	newItem.date = date;
//	Z.debug("Date: "+date);
	
	//Abstract
	var abstractXPath = '//div[@id="hc0"]/pre';
	var abstract = ZU.xpathText(doc, abstractXPath);
	newItem.abstractNote = Zotero.Utilities.trim(trimTags(abstract));
//	Z.debug("abstractNote: "+abstract);
	
	newItem.complete();
	//finish
});
}

function detectWeb(doc, url) {
	var pattern = /issues\/list\?.+q=/;

	if (pattern.test(url)) {
		return "multiple";
	} else {
		var pattern = /issues\/detail\?id=/;
		if (pattern.test(url)) {
			return "forumPost";
		}
	}
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		var titles = doc.evaluate('//td[@class="vt col_4"]/a', doc, null, XPathResult.ANY_TYPE, null);
		var title;
		while (title = titles.iterateNext()) {
			items[title.href] = title.textContent;
		}
		Zotero.selectItems(items, function (items) {
			if (!items) {
				return true;
			}
			for (var i in items) {
				articles.push(i);
			}
			Zotero.Utilities.processDocuments(articles, scrapeAndParse);
		});
	}
 	else { scrapeAndParse(doc, url); }
}
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://code.google.com/p/goagent/issues/list?can=2&q=ggc&colspec=ID+Opened+Reporter+Modified+Summary+Stars&cells=tiles",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://code.google.com/p/android/issues/detail?id=74117&colspec=ID%20Type%20Status%20Owner%20Summary%20Stars",
		"items": [
			{
				"itemType": "forumPost",
				"creators": [
					{
						"firstName": "",
						"lastName": "YogurtE...@gmail.com",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [],
				"attachments": [],
				"url": "https://code.google.com/p/android/issues/detail?id=74117",
				"title": "After using Project Structure dialog, AS messes up my build.gradle",
				"date": "Today (68 minutes ago)",
				"abstractNote": "Build: 0.8.4, AI-135.1295215, 20140722\n\nOpen \"File --> Project Structure...\"\nSelect Application Module\nSelect Build Type Tab\nSelect debug build type.\nClick OK\n\nNotice I didn't even change anything... \n\nAS makes a bunch of strange edits to my build.gradle, that break the build.\n\nAS shouldn't make any edits in this case because I didn't change anything... \nEven when it does make edits, it should minimize edits to avoid unnecessary noise in VCS commits.\n\nHere is what it does to my build.gradle:\n\nit removes:\n\nclasspath 'com.stanfy.spoon:spoon-gradle-plugin:0.10.0'\n\nfrom buildscript.dependencies\n\nIt changes this:\n\n compile(project(':myInHouseSubModule')) {\n    exclude group: 'org.slf4j'\n    exclude group: 'xpp3'\n    exclude group: 'com.squareup.dagger'\n  }\n\nto this:\n\ncompile project(':myInHouseSubModule')\n\nIt adds:\n productFlavors {}\n\nto the android block\n\nIt removes a bunch of whitespace.\n\nIt swaps double-quote for single-quote.",
				"libraryCatalog": "Google Code Issues",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	}
]
/** END TEST CASES **/