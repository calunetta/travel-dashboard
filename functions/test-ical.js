const ical = require('ical-generator').default;
const cal = ical({ name: 'Test' });
cal.createEvent({
  id: 'my-custom-uid-123',
  start: new Date(),
  end: new Date(),
  summary: 'Test summary'
});
console.log(cal.toString());
