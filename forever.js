const forever = require('forever-monitor');

const child = new (forever.Monitor)('bin/www', {
  max: 5,
  silent: true,
  args: [],
  logFile: 'logs/forever.out',
  outFile: 'logs/log.out',
  errFile: 'logs/err.out'
});

child.on('restart', function() {
  console.error('Forever restarting script for ' + child.times + ' time');
});

child.on('exit:code', function(code) {
  console.error('Forever detected script exited with code ' + code);
});

child.on('exit', function() {
  console.log('server has exited after 3 restarts');
});

child.start();
