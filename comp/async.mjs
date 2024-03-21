export function asyncify(cb, ...args) {
   const num = cb.length - args.length;
   const resolvers = new Array(num);
   const handlers = new Array(num);

   for(let i = 0; i < num; ++i) {
	   handlers[i] = new Promise((resolve) => {
		   resolvers[i] = resolve;
	   });
   }

   cb(...resolvers, ...args);

   if(num == 1) {
	   return handlers[0];
   }
   return Promise.all(handlers);
}


import { readFile, writeFile, readdir, unlink } from "node:fs";
import { exit } from "node:process";

export function read_async(path) {
	return asyncify((resolver) => {
		readFile(path, { encoding: "utf8" }, (err, data) => {
			if(err) {
				console.error(`Couldn't read ${path}:`, err);
				exit();
			} else {
				resolver(data);
			}
		});
	});
}

export function write_async(path, contents) {
	return asyncify((resolver) => {
		writeFile(path, contents, (err, data) => {
			if(err) {
				console.error(`Couldn't write ${path}:`, err);
				exit();
			} else {
				resolver(data);
			}
		});
	});
}

export function readdir_async(path) {
	return asyncify((resolver) => {
		readdir(path, (err, files) => {
			if(err) {
				console.error(`Couldn't readdir ${path}:`, err);
				exit();
			} else {
				resolver(files);
			}
		});
	});
}

export function unlink_async(path) {
	return asyncify((resolver) => {
		unlink(path, (err) => {
			if(err) {
				console.error(`Couldn't unlink ${path}:`, err);
				exit();
			} else {
				resolver();
			}
		});
	});
}
