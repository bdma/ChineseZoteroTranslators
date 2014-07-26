{
	"translatorID": "b7180b21-2739-4843-a884-d0ce9d10ec19",
	"label": "Douban Movie",
	"creator": "Alex<blog.alexpsy.com>",
	"target": "^https?://(?:www|movie).douban.com/(?:subject|doulist|celebrity|tag)\\/\\W+?",
	"minVersion": "1.4",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "csib",
	"lastUpdated": "2014-07-24 20:53:43"
}

/*
   Douban Movie Translator
   Copyright (C) 2014 Alex, alex@alexpsy.com & http://blog.alexpsy.com
   Credit: Ace Strong<acestrong@gmail.com>

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
 *   - A movie page
 *   - A doulist page
 *   - A movie star page
 *   - A search listing of movies
 */
// http://movie.douban.com/

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

// #############################
// ##### Scraper functions #####
// ############################# 

function scrapeAndParse(doc, url) {
Zotero.Utilities.HTTP.doGet(url, function(page){
	// Z.debug(page)
	var pattern;

	// 类型 & URL
	var itemType = "film";
	var newItem = new Zotero.Item(itemType);
//	Zotero.debug(itemType);
	newItem.url = url;

	// 标题
	pattern = /<title>([\s\S]*?)<\/title>/;
	if (pattern.test(page)) {
		var title = pattern.exec(page)[1].replace(" (豆瓣)","");
		newItem.title = Zotero.Utilities.trim(trimTags(title));
//		Zotero.debug("title: "+title);
	}
	
	// 导演
	page = page.replace(/\n/g, "")
	// Z.debug(page)
	pattern = /<span>\s*<span[^>]*?>\s*导演<\/span>:(.*?)<\/span>/;
	if (pattern.test(page)) {
		var authorNames = trimTags(pattern.exec(page)[1]);
		pattern = /(\[.*?\]|\(.*?\)|（.*?）)/g;
		authorNames = authorNames.replace(pattern, "").split("/");
//		Zotero.debug(authorNames);
		var author = "director";
		for (var i=0; i<authorNames.length; i++) {
			var useComma = true;
			creator= Zotero.Utilities.trim(authorNames[i]);
			pattern = /[A-Za-z]/;
			if (pattern.test(creator)) {
				pattern = /,/;
				if (!pattern.test(creator)) useComma = false; //外文名
			} else if (creator.indexOf("·")>=0) {
				useComma = false;
				creator = " :"+
				creator.slice(creator.indexOf("·")+1,creator.length)+
				", "+
				creator.slice(0,creator.indexOf("·"));
			} //译名
//			Z.debug("authorNames: "+creator);
//			Z.debug("useComma: "+useComma);
			newItem.creators.push(Zotero.Utilities.cleanAuthor(creator, author, useComma));
		}
	}
	
	// 编剧
	pattern = /<span>\s*<span [^>]*?>\s*编剧<\/span>:(.*?)<\/span>/;
	if (pattern.test(page)) {
		var scriptWriter = trimTags(pattern.exec(page)[1]);
		pattern = /(\[.*?\])/g;
		scriptWriter = scriptWriter.replace(pattern, "").split("/");
		var author = "scriptwriter";
		for (var i=0; i<scriptWriter.length; i++) {
			var useComma = true;
			creator= Zotero.Utilities.trim(scriptWriter[i]);
			pattern = /[A-Za-z]/;
			if (pattern.test(creator)) {
				pattern = /,/;
				if (!pattern.test(creator)) useComma = false; //外文名
			} else if (creator.indexOf("·")>=0) {
				useComma = false;
				creator = " :"+
				creator.slice(creator.indexOf("·")+1,creator.length)+
				", "+
				creator.slice(0,creator.indexOf("·"));
			} //译名
//			Z.debug("scriptWriter: "+creator);
//			Z.debug("useComma: "+useComma);
			newItem.creators.push(Zotero.Utilities.cleanAuthor(creator, author, useComma));
		}
	}

	// 主演
	pattern = /<span>\s*<span [^>]*?>\s*主演<\/span>:(.*?)<\/span>/;
	if (pattern.test(page)) {
		var Contributor = trimTags(pattern.exec(page)[1]);
		pattern = /(\[.*?\])/g;
		Contributor = Contributor.replace(pattern, "").split("/");
		var author = "contributor";
		for (var i=0; i<Contributor.length; i++) {
			var useComma = true;
			creator= Zotero.Utilities.trim(Contributor[i]);
			pattern = /[A-Za-z]/;
			if (pattern.test(creator)) {
				pattern = /,/;
				if (!pattern.test(creator)) useComma = false; //外文名
			} else if (creator.indexOf("·")>=0) {
				useComma = false;
				creator = " :"+
				creator.slice(creator.indexOf("·")+1,creator.length)+
				", "+
				creator.slice(0,creator.indexOf("·"));
			} //译名
//			Z.debug("Contributor: "+creator);
//			Z.debug("useComma: "+useComma);
			newItem.creators.push(Zotero.Utilities.cleanAuthor(creator, author, useComma));
		}
	}
	
	// 剧情
	var absPath = '//*[@id="link-report"]/span[1]/text()';
	var abs = "";
	for ( var i = 1; i < 9; i++ ){
		var tabsPath = absPath+'['+i+']';
		var tabs = ZU.xpathText(doc, tabsPath);
		if (tabs == null) {
			i=10
		} else {
			abs = abs+ZU.trim(tabs);
			newItem.abstractNote = ToCDB(abs);
		}
	}
	
	// 类型
	pattern = /<span [^>]*?>类型:<\/span>(.*?)<br\/>/;
	if (pattern.test(page)) {
		var genre = pattern.exec(page)[1];
		newItem.genre = Zotero.Utilities.trim(trimTags(genre)).split(" / ").toString();
//		Zotero.debug("publisher: "+publisher);
	}
	
	// 片长
	pattern = /<span [^>]*?>片长:<\/span>(.*?)<br\/>/;
	if (pattern.test(page)) {
		var runningTime = pattern.exec(page)[1].replace("分钟"," min");
		newItem.runningTime = Zotero.Utilities.trim(trimTags(runningTime));
//		Zotero.debug("numPages: "+numPages);
	}
	
	// 又名
	pattern = /<span [^>]*?>又名:<\/span>(.*?)<br\/>/;
	if (pattern.test(page)) {
		var shortTitle = pattern.exec(page)[1];
		newItem.shortTitle = Zotero.Utilities.trim(shortTitle).split(" / ").toString();
//		Zotero.debug("isbn: "+isbn);
	}
	
	// 语言
	pattern = /<span [^>]*?>语言:<\/span>(.*?)<br\/>/;
	if (pattern.test(page)) {
		var language = trimTags(pattern.exec(page)[1]);
		newItem.language = Zotero.Utilities.trim(language).split(" / ").toString();
//		Zotero.debug("language: "+language);
	}
	
	// 上映日期
	pattern = /<span [^>]*?>上映日期:<\/span>(.*?)<br\/>/;
	if (pattern.test(page)) {
		var date = Zotero.Utilities.trim(trimTags(pattern.exec(page)[1]));
		date = date.slice(0,10);
		newItem.date = date;
//		Zotero.debug("date: "+date);
	}
	
	// IMDB
	pattern = /<span [^>]*?>IMDb链接:<\/span>(.*?)<\/a><br>/;
	if (pattern.test(page)) {
		var isbn = pattern.exec(page)[1];
		newItem.extra = Zotero.Utilities.trim("IMDB ID: "+trimTags(isbn));
//		Zotero.debug("isbn: "+isbn);
	}
	
	// 标签
	var tagsPath = '//div[@class="tags-body"]/a/text()';
	var tags = ZU.xpathText(doc, tagsPath).split(", ");
	for ( i in tags ){
		newItem.tags.push(tags[i]);
	}
	
	newItem.complete();
});
}

// #########################
// ##### API functions #####
// #########################

function detectWeb(doc, url) {
	var pattern = /subject_search|doulist|celebrity|tag/;
	if (pattern.test(url)) return "multiple";
	else if (/subject\/\W+?/.test(url)) return "film";
	return false;
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		if (/doulist/.test(url)) eveluateXPath = '//tr[@class="doulist_item"]//a';
		else if (/celebrity/.test(url)) eveluateXPath = '//div[contains(@id, "movies")]//div/a';
		else if (/tag/.test(url)) eveluateXPath = '//a[contains(@href, "movie.douban.com/subject")]';
		else eveluateXPath = '//div/a[contains(@onclick, "moreurl")]';
		var titles = doc.evaluate(eveluateXPath, doc, null, XPathResult.ANY_TYPE, null);
		var title;
		while (title = titles.iterateNext()) {
			items[title.href] = trimMultispace(title.textContent);
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
 	else {
		scrapeAndParse(doc, url);
	}
}
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://movie.douban.com/subject/1293182/",
		"items": [
			{
				"itemType": "film",
				"creators": [
					{
						"firstName": "吕美特",
						"lastName": "西德尼",
						"creatorType": "director"
					},
					{
						"firstName": "罗斯",
						"lastName": "雷金纳德",
						"creatorType": "scriptwriter"
					},
					{
						"firstName": "鲍尔萨姆",
						"lastName": "马丁",
						"creatorType": "contributor"
					},
					{
						"firstName": "菲尔德",
						"lastName": "约翰",
						"creatorType": "contributor"
					},
					{
						"firstName": "科布",
						"lastName": "李",
						"creatorType": "contributor"
					},
					{
						"firstName": "",
						"lastName": "E.G.马绍尔",
						"creatorType": "contributor"
					},
					{
						"firstName": "克卢格曼",
						"lastName": "杰克",
						"creatorType": "contributor"
					},
					{
						"firstName": "宾斯",
						"lastName": "爱德华",
						"creatorType": "contributor"
					},
					{
						"firstName": "瓦尔登",
						"lastName": "杰克",
						"creatorType": "contributor"
					},
					{
						"firstName": "方达",
						"lastName": "亨利",
						"creatorType": "contributor"
					},
					{
						"firstName": "Joseph",
						"lastName": "Sweeney",
						"creatorType": "contributor"
					},
					{
						"firstName": "贝格利",
						"lastName": "埃德",
						"creatorType": "contributor"
					},
					{
						"firstName": "沃斯科维奇",
						"lastName": "乔治",
						"creatorType": "contributor"
					},
					{
						"firstName": "韦伯",
						"lastName": "罗伯特",
						"creatorType": "contributor"
					}
				],
				"notes": [],
				"tags": [
					"1957",
					"美国",
					"剧情",
					"美国电影",
					"十二怒汉",
					"人性",
					"电影",
					"经典"
				],
				"seeAlso": [],
				"attachments": [],
				"url": "http://movie.douban.com/subject/1293182/",
				"title": "十二怒汉 (豆瓣)",
				"shortTitle": "12怒汉",
				"extra": "IMDB ID:  tt0050083",
				"runningTime": "96 分钟",
				"genre": "剧情",
				"language": "英语",
				"date": "1957-04-13",
				"abstractNote": "一个在贫民窟长大的18岁少年因为涉嫌杀害自己的父亲被告上法庭，证人言之凿凿，各方面的证据都对他极为不利。十二个不同职业的人组成了这个案件的陪审团，他们要在休息室达成一致的意见，裁定少年是否有罪，如果罪名成立，少年将会被判处死刑。十二个陪审团成员各有不同，除了8号陪审员（H enry Fonda 饰）之外，其他人对这个犯罪事实如此清晰的案子不屑一顾，还没有开始讨论就认定了少年有罪。8号陪审员提出了自己的“合理疑点”，耐心地说服其他的陪审员，在这个过程中，他们每个人不同的人生观也在冲突和较量……",
				"libraryCatalog": "Douban Movie",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://movie.douban.com/doulist/13921/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://movie.douban.com/celebrity/1054453/",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://movie.douban.com/subject_search?search_text=21&cat=1002",
		"items": "multiple"
	}
]
/** END TEST CASES **/