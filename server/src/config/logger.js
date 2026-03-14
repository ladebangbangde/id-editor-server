function info(message, extra = {}) {
  console.log(JSON.stringify({ level: 'info', message, ...extra, timestamp: new Date().toISOString() }));
}

function error(message, extra = {}) {
  console.error(JSON.stringify({ level: 'error', message, ...extra, timestamp: new Date().toISOString() }));
}

module.exports = {
  info,
  error
};
