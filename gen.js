
// kye.io
// 2014.05.18
// 2014.05.20

// Requires {
var fs = require("fs");
var rimraf = require("rimraf");
var sqlite = require("sqlite3").verbose();
var marked = require("marked");
var stylus = require("stylus");
// }

// Config {
var cli = {
	
	src:"node_modules/npm/doc/cli/",
	header:""
	
};
var api = {
	
	src:"node_modules/npm/doc/api/",
	header:""
	
};
var assets = "assets/";
var docset = {
	
	name:"npm.docset",
	entries:{},
	plist:"",
	style:stylus.render(fs.readFileSync(assets + "style.styl"))
	
};
docset.dir = docset.name + "/Contents/Resources/Documents/";
docset.db = docset.name + "/Contents/Resources/docSet.dsidx";
// }

// Source assets {

// Images {
var icon = fs.readFileSync("node_modules/npm/html/favicon.ico");
// }

// Docs: cli {
fs.readdirSync(cli.src).forEach(function(fileName) {
	
	var x = {
		
		cli:{}
		
	};
	
	// Get deets {
	x.cli.mkdn = fs.readFileSync(cli.src + fileName, "utf-8");
	x.cli.html = marked(x.cli.mkdn);
	// }
	
	// Add to entries list {
	docset.entries[fileName.replace("npm-", "").replace(".md", "")] = x;
	// }
	
});
// }

// Docs: api {
fs.readdirSync(api.src).forEach(function(fileName) {
	
	var name = fileName.replace("npm-", "").replace(".md", "");
	var x = {};
	
	// Get deets {
	x.mkdn = fs.readFileSync(api.src + fileName, "utf-8");
	x.html = marked(x.mkdn);
	// }
	
	// Add to entries list {
	if(!docset.entries[name]) {
		
		docset.entries[name] = {};
		
	}
	docset.entries[name].api = x;
	// }
	
});
// }

// }

// Blank slate {
rimraf.sync(docset.name);
fs.mkdirSync(docset.name);
fs.mkdirSync(docset.name + "/Contents");
fs.mkdirSync(docset.name + "/Contents/Resources");
fs.mkdirSync(docset.name + "/Contents/Resources/Documents");
// }

// Create assets {
fs.writeFileSync(docset.name + "/Contents/Info.plist", docset.plist);
fs.writeFileSync(docset.name + "/Contents/Resources/Documents/style.css", docset.style);
// }

// Create db {
var db = new sqlite.Database(docset.db);
db.serialize(function() {
	
	db.run("CREATE TABLE searchIndex(id INTEGER PRIMARY KEY, name TEXT, type TEXT, path TEXT)");
	db.run("CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path)");
	
	// Build docs {
	for(var name in docset.entries) {
		
		var entry = docset.entries[name];
		
		var str = "";
		
		// Print cli {
		if(entry.cli) {
			
			str = str + cli.header + entry.cli.html;
			
		}
		// }
		
		// Print api {
		if(entry.api) {
			
			str = str + api.header + entry.api.html;
			
		}
		// }
		
		// Save {
		fs.writeFileSync(docset.dir + name + ".html", str);
		// }
		
		// Inject into db {
		db.run("INSERT OR IGNORE INTO searchIndex(name, type, path) VALUES ('" + name + "', 'Function', 'Documents/" + name + ".html')");
		// }
		
	}
	// }
	
	// Debug {
	db.all("SELECT * FROM searchIndex", function(err, rows) {
		
		console.log(rows.length + " entries generated");
		
	});
	// }
	
});
db.close();
// }

//console.log(cli);
