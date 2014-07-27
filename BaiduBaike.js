{
	"translatorID": "f6629d89-5374-4854-a329-77aba10b710e",
	"label": "BaiduBaike",
	"creator": "alexpsy.com",
	"target": "^https?://baike.baidu.com/*",
	"minVersion": "2.0RC",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsib",
	"lastUpdated": "2014-07-21 17:34:46"
}

/*
   BaiduBaike Translator
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
 *   - A Baidu Baike Encyclopedia page
 *   - A search listing of itmes
 *   - A Collection page(waiting for dev)
 */
// Sample Page: http://baike.baidu.com/

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
	var itemType = "encyclopediaArticle";
	var newItem = new Zotero.Item(itemType);
	url = url.slice(0,url.indexOf("?"));
	newItem.url = url;
//	Z.debug(url);

	newItem.language = doc.documentElement.lang;
	newItem.encyclopediaTitle = "百度百科";
	
	//Title
	pattern = /<title>([\s\S]*?)<\/title>/;
	if (pattern.test(page)) {
		var title = pattern.exec(page)[1];
		title = title.slice(0,title.indexOf("百度百科")-1);
		newItem.title = Zotero.Utilities.trim(trimTags(title));
//		Z.debug("title: "+title);
	}
	
	//Tags
	var tagsXPath = "//dd[@id='open-tag-item']/a";
	var tags = ZU.xpath(doc, tagsXPath);
	for (i in tags)
	{
		newItem.tags.push(tags[i].textContent);
//		Z.debug("tags: "+tags[i].textContent);
	}
	
	//Abstract
	var absXPath = "//div[@class='card-summary-content']/div[@class='para']";
	var abstract = ZU.xpathText(doc, absXPath);
	newItem.abstractNote = abstract;
//	Z.debug("abstractNote: "+abstract);
	
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

	if (pattern.test(url)) {
		return "multiple";
	} else {
		return "encyclopediaArticle";
	}
}

function doWeb(doc, url) {
	var articles = new Array();
	if(detectWeb(doc, url) == "multiple") { 
		var items = {};
		var titles = doc.evaluate("//td[@class='f']/h2/a", doc, null, XPathResult.ANY_TYPE, null);
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
		"url": "http://baike.baidu.com/view/6222.htm",
		"items": [
			{
				"itemType": "encyclopediaArticle",
				"creators": [],
				"notes": [],
				"tags": [
					"典故",
					"三国",
					"历史事件",
					"诸葛亮",
					"三国典故",
					"三国文化",
					"中国历史著作",
					"文化",
					"文学",
					"文学作品",
					"襄阳",
					"诸葛亮 躬耕地 古隆中"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://baike.baidu.com/view/6222.ht",
				"encyclopediaTitle": "百度百科",
				"title": "隆中对",
				"abstractNote": "《隆中对》选自《三国志·蜀志·诸葛亮传》，作者陈寿，是西晋的史学家。此篇文章已纳入中国人民教育出版社，人教版语文九年级(上)：第23课 《隆中对》[1] 。, 中国东汉末年诸葛亮与刘备三顾茅庐时的谈话内容，公元207年冬至208年春，当时驻军新野的刘备在徐庶建议下，三次到隆中（今襄阳城西20里）拜访诸葛亮，但直到第三次方得见（著名的“三顾茅庐”）。, 诸葛亮为刘备分析了天下形势，提出先取荆州为家，再取益州成鼎足之势，继而图取中原的战略构想。在诸葛亮出山后，没有任何的官职，直到刘备取得荆州四郡时才拜军师中郎将，刘备集团之后的种种攻略皆基于此。",
				"libraryCatalog": "BaiduBaike",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://baike.baidu.com/subview/1487/12549506.htm",
		"items": [
			{
				"itemType": "encyclopediaArticle",
				"creators": [],
				"notes": [],
				"tags": [
					"生物",
					"昆虫",
					"物种",
					"药材",
					"害虫"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html",
						"snapshot": true
					}
				],
				"url": "http://baike.baidu.com/subview/1487/12549506.ht",
				"encyclopediaTitle": "百度百科",
				"title": "蟑螂",
				"abstractNote": "体扁平，黑褐色，通常中等大小。头小，能活动。触角长丝状，复眼发达。翅平，前翅为革质后翅为膜质，前后翅基本等大，覆盖于腹部背面；有的种类无翅。不善飞，能疾走。不完全变态。产卵于卵鞘内。约有6000种，主要分布在热带、亚热带地区。生活在野外或室内。, 蟑螂，泛指属于“蜚蠊目”（学名：Blattodea）的昆虫，其中只有大约有数十种会入侵人类家居，还有数种被人类饲养为宠物及作为宠物的粮食外，绝大部份品种只能在野外山涧树林或昆虫博物馆中见到。家居最常见的蟑螂，大的有身长约5.0厘米（1.2英寸）美洲蟑螂（Periplaneta americana）、澳洲蟑螂（Periplaneta australasiae）及短翅的斑蠊（Neostylopyag rhombifolia）；小的有体长约1.5厘米（0.59英寸）的德国蟑螂（Blattella germanica）、日本姬蠊（Blattella bisignata）及亚洲蟑螂（ Blattella asahinai），热带地区的蟑螂一般比较巨大。家居蟑螂普遍夜行及畏光，野外蟑螂因品种而异，趋光性有正亦有负。[1]",
				"libraryCatalog": "BaiduBaike",
				"accessDate": "CURRENT_TIMESTAMP"
			}
		]
	},
	{
		"type": "web",
		"url": "http://baike.baidu.com/search?word=36&pn=0&rn=10&enc=utf8",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://baike.baidu.com/search?word=CDN&pn=0&rn=10&enc=utf8",
		"items": "multiple"
	}
]
/** END TEST CASES **/