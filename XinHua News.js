{
	"translatorID": "02e96635-b7e0-4470-b4e1-ae1941dab5b5",
	"label": "XinHua News",
	"creator": "Alex<blog.alexpsy.com>",
	"target": "^https?://news.xinhuanet.com/*",
	"minVersion": "1.1",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsib",
	"lastUpdated": "2014-07-24 19:32:51"
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
 *   - A Xin Hua Net News article page
 *   - A search listing of items
 */
// Sample Page: http://news.xinhuanet.com

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
//	Z.debug(page)
	
	//declare
	var itemType = "newspaperArticle";
	var newItem = new Zotero.Item(itemType);
	newItem.url = url;
//	Z.debug(url);

	newItem.language = doc.documentElement.lang;
	
	//Title & PublicationTitle
	pattern = /<title>([\s\S]*?)<\/title>/;
	if (pattern.test(page)) {
		var title = pattern.exec(page)[1];
		var publicationTitle = title.slice(title.indexOf("-")+1,title.length);
		newItem.publicationTitle = Zotero.Utilities.trim(trimTags(publicationTitle));
//		Z.debug("publicationTitle: "+publicationTitle);
		title = ToCDB(title.slice(0,title.indexOf("-")));
		newItem.title = Zotero.Utilities.trim(trimTags(title));
//		Z.debug("title: "+title);
	}
	
	//Author, 
	page = page.replace(/\s/g, "")
	pattern = /责任编辑：(.*?)]\<\/div\>/;
	if (pattern.test(page)) {
		var author = pattern.exec(page)[1];
		author = " :"+author.slice(0,1)+", "+author.slice(1,author.length);
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author,"author", false));
//		Z.debug("author: "+author);
	}
	
	//Date
	pattern = /<spanid="pubtime">(.*?)日/;
	if (pattern.test(page)) {
		var date = pattern.exec(page)[1];
		date = date.replace("年","-").replace("月","-");
		newItem.date = date;
//		Z.debug("date: "+date);
	}
	
	//Tags
	pattern = /<metaname="keywords"content="(.*?)"\/>/;
	if (pattern.test(page)) {
		var tags = pattern.exec(page)[1].split(",");
		newItem.tags = tags;
//		Z.debug("tags: "+tags);
	}
	
	//Abstract
	var parXPath = '//div[@id="content"]/p';
	var par = ZU.xpathText(doc, parXPath);
	for (i in par) {
		absXPath = '//div[@id="content"]/p'+"["+i+"]"+"/text()";
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
	
	//See Also
	var seeAlsoXPath = '//div[contains(@id, "Relation")]//a';
	var seeAlso = ZU.xpath(doc, seeAlsoXPath);
	for (i in seeAlso) {
		var seealso = frontCut(seeAlso[i].href,"#");
		seealso = frontCut(seeAlso[i].href,"?");
		newItem.seeAlso.push(seealso);
//		Z.debug("seeAlso["+i+"]: "+seeAlso[i].href);
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
	var pattern = /info.search.news.cn\/result.jspa/;

	if (pattern.test(url)) return "multiple";
	else {
		var pattern = /htm/g;
		if (pattern.test(url)) return "newspaperArticle";
	}
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		var titles = doc.evaluate('//div[@id="extresult"]//a',	doc, null, XPathResult.ANY_TYPE, null);
		var title;
		var i=0;
		while (title = titles.iterateNext()) {
			i++;
			if (title.href.indexOf("news.xinhuanet.com")==-1) continue;
			if (title.href.indexOf("ziliao")>-1) continue;
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
		"url": "http://info.search.news.cn/result.jspa?ss=2&t=1&t1=0&rp=%5Bobject+HTMLInputElement%5D&ct=%C2%ED%BA%BD&n1=%C2%ED%BA%BD&btn=%CB%D1+%CB%F7&np=2",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://info.search.news.cn/result.jspa?ss=2&t=1&t1=0&rp=%5Bobject+HTMLInputElement%5D&ct=%C2%ED%BA%BD&n1=%C2%ED%BA%BD&btn=%CB%D1+%CB%F7&np=1",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://news.xinhuanet.com/2014-07/23/c_1111769033.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"firstName": "丁",
						"lastName": "峰",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"台湾",
					"复兴",
					"时数",
					"马公",
					"澎湖"
				],
				"seeAlso": [
					"http://news.xinhuanet.com/yzyd/local/20140723/c_1111768986.htm",
					"http://news.xinhuanet.com/2014-07/24/c_1111769051.htm",
					"http://news.xinhuanet.com/2014-07/24/c_1111769121.htm",
					"http://news.xinhuanet.com/yzyd/local/20140724/c_1111770842.htm",
					"http://news.xinhuanet.com/2014-07/24/c_1111769137.htm",
					"http://news.xinhuanet.com/2014-07/23/c_1111768992.htm",
					"http://news.xinhuanet.com/2014-07/24/c_1111784123.htm",
					"http://news.xinhuanet.com/yuqing/2014-07/24/c_126792839.htm",
					"http://news.xinhuanet.com/2014-07/21/c_1111725923.htm",
					"http://news.xinhuanet.com/2014-07/24/c_1111769139.htm"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://news.xinhuanet.com/2014-07/23/c_1111769033.htm",
				"publicationTitle": "新华网",
				"title": "台湾复兴航空:事故航班受天候影响迫降",
				"date": "2014-07-23",
				"abstractNote": "新华网台北7月23日电(记者刘刚　陈君), 复兴航空公司23日晚间召开新闻发布会声明,该公司GE222航班原订16时起飞,因台风因素延迟起飞。原订18时30分抵达马公,受天候影响,紧急迫降于机场附近西溪村。",
				"libraryCatalog": "XinHua News",
				"accessDate": "CURRENT_TIMESTAMP",
				"shortTitle": "台湾复兴航空"
			}
		]
	},
	{
		"type": "web",
		"url": "http://news.xinhuanet.com/2014-07/24/c_1111769178.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"firstName": "周",
						"lastName": "光扬",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"台湾",
					"习近平",
					"诚挚",
					"转达",
					"哀悼"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://news.xinhuanet.com/2014-07/24/c_1111769178.htm",
				"publicationTitle": "新华网",
				"title": "国务院台办向台湾方面转达习近平总书记对台湾空难遇难同胞的哀悼",
				"date": "2014-07-24",
				"abstractNote": "新华网北京7月24日电　据台湾媒体报道,23日晚7时许,台湾复兴航空一架从高雄飞往澎湖的GE222次航班因天气不佳紧急迫降时失事,造成47人罹难,11人受伤。",
				"libraryCatalog": "XinHua News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	}
]
/** END TEST CASES **/