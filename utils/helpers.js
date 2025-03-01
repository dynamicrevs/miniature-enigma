module.exports = {
  formatDate: (date) => date.toISOString().replace('T', ' ').substring(0, 19),
};
