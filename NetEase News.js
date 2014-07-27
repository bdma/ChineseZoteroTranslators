{
	"translatorID": "dccb38e1-ce63-467e-8ff8-d8896eb90ff4",
	"label": "NetEase News",
	"creator": "Alex<blog.alexpsy.com>",
	"target": "^http?://(?:news.163|(?:news|www).yodao).com",
	"minVersion": "1.3",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsib",
	"lastUpdated": "2014-07-24 17:10:56"
}

/*
   NetEase News Translator
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
 *   - A netease article page
 *   - A search listing of itmes
 */
// Sample Page: http://news.163.com

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
	var itemType = "newspaperArticle";
	var newItem = new Zotero.Item(itemType);
//	url = url.slice(0,url.indexOf("?"));
	newItem.url = url;
//	Z.debug(url);

	newItem.language = doc.documentElement.lang;
	
	//Title & PublicationTitle
	pattern = /<title>([\s\S]*?)<\/title>/;
	if (pattern.test(page)) {
		var title = pattern.exec(page)[1];
		var publicationTitle = title.slice(title.indexOf("_")+1,title.length);
		newItem.publicationTitle = Zotero.Utilities.trim(trimTags(publicationTitle));
//		Z.debug("publicationTitle: "+publicationTitle);
		title = title.slice(0,title.indexOf("_"));
		newItem.title = Zotero.Utilities.trim(trimTags(title));
//		Z.debug("title: "+title);
	}
	
	//Author, Date
	pattern = /<div class="left">(.*?)<\/div>/;
	if (pattern.test(page)) {
		var date = pattern.exec(page)[1];
		var author = date.slice(date.indexOf('"nofollow">')+11,date.indexOf('</a>'));
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author,"author", true));
//		Z.debug("author: "+author);
		date = date.slice(date.indexOf("201"),10);
		newItem.date = date;
//		Z.debug("date: "+date);
	}
	
	//Tags
	var tagsXPath = '//div[@class="mod-title ep-title-3 clearfix"]//a';
	var tags = ZU.xpath(doc, tagsXPath);
	for (i in tags) {
		newItem.tags.push(tags[i].textContent);
//		Z.debug("tags: "+tags[i].textContent);
	}
	
	//Abstract
	var parXPath = '//div[@id="endText"]/p/text()';
	var par = ZU.xpathText(doc, parXPath);
	for (i in par) {
		absXPath = '//div[@id="endText"]/p'+"["+i+"]"+"/text()";
		par = ZU.xpathText(doc, absXPath);
//		Z.debug(i);
//		Z.debug(absXPath);
//		Z.debug(par);
		if (par==null) {par="1"}
		if (par.length>30) {
			if (par.indexOf(" ")<10) {
				abstract = par.slice(par.indexOf(" "),par.length);
			} else if (par.indexOf(" ")>par.length-10) {
				abstract = par.slice(0,par.indexOf(" "));
			} else {
				abstract = par;
			}
			newItem.abstractNote = abstract;
//			Z.debug("abstractNote: "+abstract+"; i="+i);
			break;
		}
	}
	
	//See Also
	var seeAlsoXPath = '//div[@id="js-ep-reletag"]/ul/li/a';
	var seeAlso = ZU.xpath(doc, seeAlsoXPath);
	for (i in seeAlso) {
		if (seeAlso[i].href.indexOf("#")!=-1) {
			newItem.seeAlso.push(seeAlso[i].href.slice(0,seeAlso[i].href.indexOf("#")));
//			Z.debug("seeAlso: "+seeAlso[i].href.slice(0,seeAlso[i].href.indexOf("#")));
		} else if (seeAlso[i].href.indexOf("?")!=-1) {
			newItem.seeAlso.push(seeAlso[i].href.slice(0,seeAlso[i].href.indexOf("?")));
//			Z.debug("seeAlso: "+seeAlso[i].href.slice(0,seeAlso[i].href.indexOf("?")));
		} else {
			newItem.seeAlso.push(seeAlso[i].href);
//			Z.debug("seeAlso: "+seeAlso[i].href);
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
	var pattern = /search\?/;

	if (pattern.test(url)) {
		return "multiple";
	} else {
		var pattern = /html/g;
		if (pattern.test(url)) {
			return "newspaperArticle";
		}
	}
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		if (/site=163.com/g.test(url)) {
			var titles = doc.evaluate('//a[@id="hitURL$pos"]', doc, null, XPathResult.ANY_TYPE, null);
		} else if (/news.yodao.com/g.test(url)) {
			var titles = doc.evaluate('//ul[@id="results"]/li/h3/a', doc, null, XPathResult.ANY_TYPE, null);
		}
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
		"url": "http://news.163.com/14/0723/15/A1RKQGGR00014AED.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "北京晚报",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"中国梦",
					"故事",
					"市委宣传部"
				],
				"seeAlso": [
					"http://tag.163.com/news/108/108220/1.html",
					"http://tag.163.com/news/86/86473/1.html",
					"http://news.tag.163.com/main/53626/page_1.html",
					"http://love.163.com/park/xunren/102001"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://news.163.com/14/0723/15/A1RKQGGR00014AED.html",
				"publicationTitle": "网易新闻中心",
				"title": "《中国梦365个故事》  将走出国门",
				"date": "2014-07-23",
				"abstractNote": "系列微纪录片《中国梦365个故事》即将走出国门，在英国普罗派乐卫视播出。",
				"libraryCatalog": "NetEase News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://news.163.com/13/0321/15/8QGJE7II0001124J.html",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "中国青年网",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://news.163.com/13/0321/15/8QGJE7II0001124J.html",
				"publicationTitle": "网易新闻中心",
				"title": "中国梦需要每一个脚踏实地的足印",
				"date": "2013-03-21",
				"abstractNote": "。",
				"libraryCatalog": "NetEase News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://www.yodao.com/search?q=%C2%ED%BA%BD&ue=gbk&ttimesort=10&keyfrom=163.page&site=163.com",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://news.yodao.com/search?keyfrom=news.163&suser=user163&ue=gbk&q=%C2%ED%BA%BD&Submit=&site=%CD%F8%D2%D7&in=page",
		"items": "multiple"
	}
]
/** END TEST CASES **/