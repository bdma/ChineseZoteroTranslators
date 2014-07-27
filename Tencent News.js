{
	"translatorID": "e17ed2f5-7a67-482a-94f7-01d981dedf94",
	"label": "Tencent News",
	"creator": "Alex<blog.alexpsy.com>",
	"target": "^https?://(?:(?:edu|ent|fashion|finance|mil|news|soccer|tech|digi.tech).qq|www.sogou).com",
	"minVersion": "1.2",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsib",
	"lastUpdated": "2014-07-25 17:46:15"
}

/*
   Tencent News Translator
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
 *   - A Tencent Digital article page
 *   - A Tencent Education article page
 *   - A Tencent Fiannce article page
 *   - A Tencent Fianncial Stock article page
 *   - A Tencent News article page
 *   - A Tencent Sport article page
 *   - A Tencent Study Aboard article page
 *   - A Tencent Technology article page
 *   - A search listing of items
 */
// Sample Page: http://digi.tech.qq.com
// Sample Page: http://edu.qq.com
// Sample Page: http://entertainment.qq.com
// Sample Page: http://fashion.qq.com
// Sample Page: http://finance.qq.com
// Sample Page: http://mil.qq.com
// Sample Page: http://news.qq.com
// Sample Page: http://tech.qq.com

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
		} else tmp += String.fromCharCode(str.charCodeAt(i));
		if(String.charCodeAt(i)==12288) tmp = String.fromCharCode(32);
	}
	return tmp;
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
		var publicationTitle = title.slice(title.indexOf("_")+1,title.length);
		newItem.publicationTitle = Zotero.Utilities.trim(trimTags(publicationTitle));
//		Z.debug("publicationTitle: "+publicationTitle);
		title = ToCDB(title.slice(0,title.indexOf("_")));
		newItem.title = Zotero.Utilities.trim(trimTags(title));
//		Z.debug("title: "+title);
	}
	
	//Author, 
	page = page.replace(/\s/g, "")
//	Z.debug(page);
	pattern = /责任编辑：(.*?)]\<\/div\>/;
	if (pattern.test(page)) {
		var author = pattern.exec(page)[1];
//		author = " :"+author.slice(0,1)+", "+author.slice(1,author.length);
		newItem.creators.push(Zotero.Utilities.cleanAuthor(author,"author", true));
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
	var tagsXPath = '//h2[contains(@bosszone, "keyword")]//a';
	var tags = ZU.xpathText(doc,tagsXPath);
	if (tags!=null) tags = tags.split(", ");
	for (i in tags) {
		newItem.tags.push(tags[i]);
//		Z.debug("tags["+i+"]"+tags[i]);
	}
	
	//Abstract
	var parXPath = '//p[contains(@style,"TEXT-INDENT")]';
	var par = ZU.xpathText(doc, parXPath);
	for (i in par) {
		absXPath = parXPath+"["+i+"]";
		par = ZU.xpathText(doc, absXPath);
//		Z.debug(i);
		if (par==null) par="1";
		if (par.length>30) {
			abstract = ToCDB(par).replace("\n(微博)\n","");
			newItem.abstractNote = abstract;
//			Z.debug("abstractNote: "+abstract+"; i="+i);
			break;
		}
	}
	
	//See Also
	var seeAlsoXPath = '//a[contains(@class, "RelaLinkStyle")]';
	var seeAlso = ZU.xpath(doc, seeAlsoXPath);
	for (i in seeAlso) {
		newItem.seeAlso.push(seeAlso[i].href);
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
	var pattern = /sogou\?query=|\?tags=/;
	if (pattern.test(url)) return "multiple";
	else {
		var pattern = /\/a\/\d{4}[0-1]\d[0-3]\d\/\d*\.htm/;
		if (pattern.test(url)) return "newspaperArticle";
	}
	return false;
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		if (/sogou\?query=/.test(url)) var eveluateXPath = '//h3/a[contains(@href,"news.qq.com/a")]';
		else if (/\?tags=/.test(url)) var eveluateXPath = '//dd[@class="listTitle"]//a';
		var titles = doc.evaluate(eveluateXPath, doc, null, XPathResult.ANY_TYPE, null);
		var title;
		var i=0;
		while (title = titles.iterateNext()) {
			i++;
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
		"url": "http://news.qq.com/a/20140712/017600.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "flyguo",
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
				"url": "http://news.qq.com/a/20140712/017600.htm",
				"language": "zh-CN",
				"publicationTitle": "新闻_腾讯网",
				"title": "安徽政协副主席韩先聪被调查",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://news.qq.com/dc_column_article/TagsList.htm?tags=%E4%B8%AD%E7%BA%AA%E5%A7%94",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://www.sogou.com/sogou?query=%C2%ED%BA%BD&pid=sogou-wsse-b58ac8403eb9cf17-0003",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://edu.qq.com/a/20140721/062754.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "judycai",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [
					"http://edu.qq.com/a/20140721/049891.htm",
					"http://edu.qq.com/a/20140718/025372.htm",
					"http://edu.qq.com/a/20140718/025227.htm",
					"http://edu.qq.com/a/20140717/059276.htm"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://edu.qq.com/a/20140721/062754.htm",
				"language": "zh-CN",
				"publicationTitle": "教育_腾讯网",
				"title": "双语:荷兰自行车手两次避开马航出事故航班",
				"abstractNote": "A Dutch cyclist who says he was scheduled to be on both Malaysia Airlines flights MH370 and MH17 — only to switch his tickets at the last minute — knows he's lucky to be alive but has decided to stop speaking publicly about it.",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP",
				"shortTitle": "双语"
			}
		]
	},
	{
		"type": "web",
		"url": "http://finance.qq.com/a/20140722/006935.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "loganzhu",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"马航"
				],
				"seeAlso": [
					"http://finance.qq.com/a/20140722/005693.htm",
					"http://finance.qq.com/a/20140721/058647.htm",
					"http://finance.qq.com/a/20140721/053687.htm"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://finance.qq.com/a/20140722/006935.htm",
				"language": "zh-CN",
				"publicationTitle": "财经_腾讯网",
				"title": "马航空难或促使荷兰反思与俄罗斯经济联系",
				"abstractNote": "北京时间7月22日凌晨消息,作为一个遍地都是商人的国家,荷兰通常不喜欢让政治干预商业。但是,在发生193名荷兰公民在马来西亚航空公司的空难中丧生这一重大事件以后,这种情况可能会发生改变。",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://fashion.qq.com/a/20140725/003548.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "heatherhe",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [
					"http://fashion.qq.com/a/20140706/004278.htm",
					"http://fashion.qq.com/a/20140505/005692.htm",
					"http://fashion.qq.com/a/20140504/018055.htm"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://fashion.qq.com/a/20140725/003548.htm",
				"language": "zh-CN",
				"publicationTitle": "时尚_腾讯网",
				"title": "用围巾感受别样浪漫 8款围巾装扮你的造型",
				"abstractNote": "在一条印花连衣裙或单薄的无袖衬衫外披上一条丝质印花围巾,这样的场景想想都觉得优雅又浪漫。现在连包包的提手上都有自己的专属围巾了,身为精致女人怎能还不快用围巾把自己装扮起来!8款精选印花围巾,让你感受这别样的小情调。",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://tech.qq.com/a/20140725/019378.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "marsrxdou",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [
					"http://tech.qq.com/a/20140409/010862.htm",
					"http://tech.qq.com/a/20140312/021608.htm",
					"http://tech.qq.com/a/20140312/007395.htm"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://tech.qq.com/a/20140725/019378.htm",
				"publicationTitle": "科技_腾讯网",
				"title": "腾讯等三家民营银行筹建获批",
				"abstractNote": "腾讯科技讯(雷建平)7月25日消息,银监会党委书记、主席尚福林今日在银监会2014年上半年全国银行业监督管理工作会议上披露,银监会已正式批准三家民营银行筹建申请。",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://digi.tech.qq.com/a/20140724/010057.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "yangzhao",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [
					"http://digi.tech.qq.com/a/20140422/001690.htm",
					"http://digi.tech.qq.com/a/20140418/005633.htm",
					"http://digi.tech.qq.com/a/20131126/002257.htm",
					"http://v.qq.com/page/a/0/f/a0127n51m8f.html",
					"http://v.qq.com/page/c/0/l/c0011odyfcl.html"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://digi.tech.qq.com/a/20140724/010057.htm",
				"publicationTitle": "数码_腾讯网",
				"title": "这10款剃须刀是型男最佳选择 起价380元",
				"abstractNote": "腾讯家电讯(编译:Ben)如果你是一个大老爷们,那么胡须就是你一生的“诅咒”,显然这个麻烦的东西需要你经常清理,否则便会像流浪汉一般邋遢难堪。不过,随着审美水平的不断多元化,胡须不一定要完全剃光,事实上适当蓄须对皮肤还更有益处。但显然,我们不能任其肆意生长,必须进行修剪、造型,才能变成一个型男。不管你想要硬汉式的络腮胡、还是傲娇的山羊胡,一款胡须修剪器都能够帮助你更好地打理造型,可谓是开启型男之路的第一步。下面,就为大家介绍几款最好的胡须修剪器。",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://edu.qq.com/a/20140723/013311.htm",
		"items": [
			{
				"itemType": "newspaperArticle",
				"creators": [
					{
						"lastName": "laineyliu",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [
					"http://edu.qq.com/a/20140722/018288.htm",
					"http://edu.qq.com/a/20140722/014661.htm",
					"http://edu.qq.com/a/20140721/068119.htm",
					"http://edu.qq.com/a/20140721/068104.htm",
					"http://edu.qq.com/a/20140718/019379.htm"
				],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://edu.qq.com/a/20140723/013311.htm",
				"language": "zh-CN",
				"publicationTitle": "教育_腾讯网",
				"title": "中国留学生学术作弊屡禁不鲜 英语成拦路虎",
				"abstractNote": "取消考试成绩,并记过处分,这是英国某所名校金融专业大二学生李鑫(化名)的留学生涯的一大污点。",
				"libraryCatalog": "Tencent News",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	}
]
/** END TEST CASES **/