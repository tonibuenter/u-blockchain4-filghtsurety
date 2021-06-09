const findProcess = require('find-process');
const { spawnSync } = require('child_process');

stopProcessByPort(process.argv[2]);

async function stopProcessByPort(port) {
  let list;
  if (port) {
    list = await findProcess('port', port);
    list.forEach((e) => {
      spawnSync('kill', ['-9', e.pid], {
        cwd: './',
        stdio: [process.stdin, process.stdout, process.stderr],
        shell: true
      });
    });
  } else {
    console.error('port missing');
  }
}
