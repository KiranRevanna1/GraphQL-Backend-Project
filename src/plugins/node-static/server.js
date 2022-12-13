let http = require('http');
let url = require('url');
let querystring = require('querystring');
let static = require('node-static');
const { title } = require('process');
let fileServer = new static.Server('.');

const GRAPHQL_URL = "http://localhost:4000/graphql";
async function fetchGreeting() {
  const query = `
        query {
          getUserShortcuts {
            description
            id
            title
            url
          }
        }
  `;
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Auth": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTY3MDgyMjM2M30.fJgDKT0ge_x-Z48PWd_2MxVUitFlkDVMJ2vly4TpAk4",
    },
    body: JSON.stringify({
      query
    }),
  });
  const { data } = await response.json();
  return data;
}


function onshortcuts(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
  });

  let i = 0;

  let timer = setInterval(write, 1000);
  write();
  let temp =fetchGreeting();

  function write() {
    i++;
    // if (i == 4) {
    //   res.write('event: bye\ndata: bye-bye\n\n');
    //   clearInterval(timer);
    //   res.end();
    //   return;
    // }

    fetchGreeting().then(({ getUserShortcuts }) => {
      const title = JSON.stringify(getUserShortcuts);
      res.write('data: ' + title + '\n\n');
      return title;
    });
  }
}

function accept(req, res) {

  if (req.url == '/shortcuts') {
    onshortcuts(req, res);
return;   
  }

  fileServer.serve(req, res);
}


if (!module.parent) {
  http.createServer(accept).listen(8080);
} else {
  exports.accept = accept;
}