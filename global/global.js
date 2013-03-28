Drivers = new Meteor.Collection("drivers");
Races = new Meteor.Collection("races");
Picks = new Meteor.Collection("picks");

//permissions
Picks.allow({
    insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
	return (userId && doc.owner === userId);
    },
    update: function (userId, doc, fields, modifier) {
    // can only change your own documents
	return doc.owner === userId;
    },
    remove: function (userId, doc) {
    // can only remove your own documents
	return doc.owner === userId;
    },
    fetch: ['owner']
});

Picks.deny({
    update: function (userId, docs, fields, modifier) {
    // can't change owners
	return _.contains(fields, 'owner');
    },
    fetch: [] // no need to fetch 'owner'
});

Races.allow({
    insert: function () {return false},
    update: function () {return true},
    remove: function () {return false}
});

var timeToTuesday = function (now) {
    var days = (9 - now.getUTCDay())%7;
    var hours = (12 - now.getUTCHours());
    var minutes = 0 - now.getUTCMinutes();
    var seconds = 0 - now.getUTCSeconds();
    var milliseconds = 0 - now.getUTCMilliseconds();
    var timeOffset = milliseconds + 1000*(seconds + 60*(minutes + 60*(hours + 24*days)));
    return timeOffset;
}

