{
	"translatorID": "1c3d1362-1d74-4c54-98d2-db858f0d0181",
	"label": "CCDI.gov.cn",
	"creator": "Alex<blog.alexpsy.com>",
	"target": "http://www.ccdi.gov.cn",
	"minVersion": "1.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsib",
	"lastUpdated": "2014-07-25 19:21:33"
}

/*
   Chinese Central Discipline Inspection News Translator
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
 *   - A article page in ccdi.gov.cn
 *   - A search listing of items
 */
// Useage: http://news.xinhuanet.com

// #################################
// #### Local utility functions ####
// #################################

function trimTags(text) {
	return text.replace(/(<.*?>)/g, "");
}

function trimMultispace(text) {
	return text.replace(/\n\s+/g, "\n");
}

function ToCDB(str) {
	var tmp = "";
	for(var i=0;i<str.length;i++) {
		if (str.charCodeAt(i)>65248&&str.charCodeAt(i)<65375) {
			tmp += String.fromCharCode(str.charCodeAt(i)-65248);
		} else {
			tmp += String.fromCharCode(str.charCodeAt(i));
		}
		if(String.charCodeAt(i)==12288) {
			tmp = String.fromCharCode(32);
		}
	}
	return tmp 
}

function frontCut(item, part, num) {
	if (!num) num=0;
	var t = item.indexOf(part);
	if (t>=0) return item.slice(0,t+num);
}

function backCut(item, part, num) {
	if (!num) num=0;
	var t = item.indexOf(part);
	if (t>=0) return item.slice(t+num,item.length);
}

// #############################
// ##### Scraper functions #####
// ############################# 

function scrapeAndParse(doc, url) {
Zotero.Utilities.HTTP.doGet(url, function(page){
	var pattern;
	page = page.replace(/\s/g, "")
//	Z.debug(page)
	
	//declare
	var itemType = "newspaperArticle";
	var newItem = new Zotero.Item(itemType);
	newItem.url = url;
//	Z.debug(url);

	newItem.language = doc.documentElement.lang;
	
	//Title
	pattern = /<title>(.*?)<\/title>/;
	if (pattern.test(page)) {
		var title = pattern.exec(page)[1];
		title = ToCDB(title.slice(0,title.indexOf("——")));
		newItem.title = Zotero.Utilities.trim(trimTags(title));
//		Z.debug("title: "+title);
	}
	
	//PublicationTitle
	pattern = /<emclass="e1">来源：(.*?)<\/em>/;
	if (pattern.test(page)) {
		var publicationTitle = pattern.exec(page)[1];
		newItem.publicationTitle = Zotero.Utilities.trim(trimTags(publicationTitle));
//		Z.debug("publicationTitle: "+publicationTitle);
	}
	
	//Date
	pattern = /<emclass="e2">发布时间：(.*?)<\/em>/;
	if (pattern.test(page)) {
		var date = pattern.exec(page)[1];
		date = date.slice(0,10);
		newItem.date = date;
//		Z.debug("date: "+date);
	}
	
	//Tags
	pattern = /<metahttp-equiv="keywords"content='(.*?)('\/|\u0022)>/;
	if (pattern.test(page)) {
		var tags = pattern.exec(page)[1].split(";");
		newItem.tags = tags;
	}
	if (tags==null) {
		pattern = /<metahttp-equiv="keywords"content=\u0022(.*?)\u0022>/;
		if (pattern.test(page)) {
			var tags = pattern.exec(page)[1].split(";");
			for (i in tags) {
				if (tags[i]=="") tags.splice(i,1);
			}
			newItem.tags = tags;
		}
	}
//	Z.debug("tags: "+tags);
	
	//Abstract
	var parXPath = '//div[@class="TRS_Editor"]/p';
	var par = ZU.xpathText(doc, parXPath);
	for (i in par) {
		absXPath = '//div[@class="TRS_Editor"]/p'+"["+i+"]"+"/text()";
		par = ZU.xpathText(doc, absXPath);
//		Z.debug(i);
		if (par==null) par="1";
		if (par.length>30) {
			abstract = ToCDB(par);
			newItem.abstractNote = abstract;
//			Z.debug("abstractNote: "+abstract+"; i="+i);
			break;
		}
	}
	
	//attachments
	newItem.attachments.push({
		url: newItem.url,
		title: 'Snapshot',
		mimeType: 'text/html',
		snapshot: true
	});
	
	newItem.complete();
	//finish
});
}

function detectWeb(doc, url) {
	var pattern = /search/;

	if (pattern.test(url)) return "multiple";
	else {
		var pattern = /html/g;
		if (pattern.test(url)) return "newspaperArticle";
	}
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		var titles = doc.evaluate('//b/a',	doc, null, XPathResult.ANY_TYPE, null);
		var title;
		var i=0;
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
		"url": "http://www.ccdi.gov.cn/was5/web/search",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://www.ccdi.gov.cn/xwyw/201407/t20140725_25560.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [],
				"notes": [],
				"tags": [
					"徐励明",
					"广西壮族自治区纪律检查委员会",
					"广西壮族自治区人民政府",
					"处分",
					"开除公职",
					"违法",
					"严重违纪",
					"中国共产党",
					"廉洁自律",
					"立案'"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://www.ccdi.gov.cn/xwyw/201407/t20140725_25560.html",
				"title": "广西区政府驻广州办事处原主任徐励明被双开",
				"publicationTitle": "中央纪委监察部网站",
				"date": "2014-07-25",
				"abstractNote": "日前,广西壮族自治区纪律检查委员会对广西壮族自治区人民政府驻广州办事处原党组书记、主任徐励明严重违纪违法问题进行了立案检查。",
				"libraryCatalog": "CCDI.gov.cn",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	}
]
/** END TEST CASES **/