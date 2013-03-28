Meteor.subscribe("drivers");
Meteor.subscribe("races");
Meteor.subscribe("picks");
Meteor.subscribe("futurepicks");
Meteor.subscribe("allUserData");

var okCancelEvents = function (selector, callbacks) {
    var ok = callbacks.ok || function () {};
    var cancel = callbacks.cancel || function () {};

    var events = {};
    events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
	function (evt) {
	    if (evt.type === "keydown" && evt.which === 27) {
		// escape = cancel
		cancel.call(this, evt);

	    } else if (evt.type === "keyup" && evt.which === 13 ||
		       evt.type === "focusout") {
		// blur/return/enter = ok/submit if non-empty
		var value = String(evt.target.value || "");
		if (value)
		    ok.call(this, value, evt);
		else
		    cancel.call(this, evt);
	    }
	};

    return events;
};

Template.body.commissioner = function () {
    var commissionerIds = ["u8A3sZzAqA3AXc7x8", "xrhtrBSMe9qjEqXrb", "dyxgi5q749ctmFB78"];
    return (1 + _.indexOf(commissionerIds, Meteor.userId()));
};

Template.races.race = function () {
    return Races.find({}, {sort: {raceNumber: 1}});
};

Template.races.otherPlayersHeader = function () {
    var string = Meteor.users.find({_id: {$not: Meteor.userId()}}, {sort: {_id: 1}}).map(function (user) {
	var displayName = user.profile ? user.profile.name : user.emails ? user.emails[0].address : '';
	return '<th>' + displayName + '</th>';
    }).join('');
    return string;
};

Template.race.locked = function () {
    var raceDate = this.date;
    return raceDate < new Date();
};

Template.race.pastOtherPicks = function (raceId) {
    var otherUserIds = Meteor.users.find({_id: {$not: Meteor.userId()}}, {sort: {_id: 1}}).map(function (user) {return user._id});
    var tds = _.map(otherUserIds, function (userId) {
	var pick = 'No pick made';
	var classstring = 'class="nopick"';
	if (Picks.find({racename: raceId, owner: userId}).count()){
	    pickObj = Picks.findOne({racename: raceId, owner: userId});
	    pick = pickObj.pick;
	    classstring = (pickObj.autopick == "No Pick") ? 'class="nopick"' : '';
	}
	return '<td ' + classstring + '>' + pick + '</td>';
    });
    return tds.join('');
};

Template.race.futureOtherPicks = function (raceId) {
    var otherUserIds = Meteor.users.find({_id: {$not: Meteor.userId()}}, {sort: {_id: 1}}).map(function (user) {return user._id});
    var tds = _.map(otherUserIds, function (userId) {
        var pick = Picks.find({racename: raceId, owner: userId}).count() ?
            'Pick Made' : '';
        return '<td>' + pick + '</td>';
    });
    return tds.join('');
};

Template.race.placeholder = function () {
    var thisRaceNumber;
    var usedDrivers = Races.find({raceNumber: {$lt: 5}}).map(function (race) {
	var thisPick = Picks.findOne({racename: race.raceId}); 
	return thisPick ? thisPick.pick : null});
    return Drivers.find({name: {$nin: usedDrivers}});
}

Template.driverSelect.freeDriver = function () {
    var raceName = this.toString();
    var thisRaceNumber = Races.findOne({raceId: raceName}).raceNumber;
    var userId = Meteor.userId();
    var selectedDriver = '';
    if (Picks.find({owner: userId, racename: raceName}).count()) {
	selectedDriver = Picks.findOne({owner: userId, racename: raceName}).pick;
    }
    var usedDrivers = Races.find({raceNumber: {$lt: thisRaceNumber}}).map(function (race) {
	var thisPick = Picks.findOne({racename: race.raceId}); 
	return thisPick ? thisPick.pick : null});
    var drivers = Drivers.find({name: {$nin: usedDrivers}}).map(function (driver) {
	var isSelected = (driver.name == selectedDriver ? 'selected' : '');
	return {name: driver.name, selected: isSelected};
    });
    return drivers;
};

Template.allDriverSelect.driver = function () {
    return Drivers.find().fetch();
};

Template.ownerSelect.owner = function () {
    var allOwners = Meteor.users.find().fetch();
    return allOwners.map(function (owner) {
	var name = '';
	if (owner.profile) {
	    name = owner.profile.name;
	}
	else {
	    name = owner.emails[0].address;
	}
	owner.name = name;
	return owner;
    });
};

Template.raceSelect.race = function () {
    return Races.find({},{sort: {raceNumber: 1}}).fetch();
};

Template.commissionerTools.events({
    'click #commissionerSetPick': function (event) {
	var ownerName = $('#commOwner').val();
	var ownerId = Meteor.users.findOne({$or: [{"profile.name": ownerName}, {"emails.0.address": ownerName}]})._id;
	var raceName = $('#commRace').val();
	var raceId = Races.findOne({name: raceName}).raceId;
	var driverName = $('#commDriver').val();
	Meteor.call("commpick",ownerId,raceId,driverName);
    }
});

Template.race.events({
    'change select': function(event) {
	var userId = Meteor.userId();
	var raceId = event.currentTarget.getAttribute("id");
	var selectedDriver = event.currentTarget.value;
	if (!Picks.find({owner: userId, racename: raceId}).count()) {
	    Picks.insert({owner: userId, racename: raceId, pick: selectedDriver});
	}
	else {
	    var pickId = Picks.findOne({owner: userId, racename: raceId})._id;
	    Picks.update({_id: pickId}, {$set: {pick: selectedDriver}})
	}
	if (Picks.find({owner: userId, pick: selectedDriver, racename: {$not: raceId}}).count()) {
	    var pickId = Picks.findOne({owner: userId, pick: selectedDriver, racename: {$not: raceId}})._id;
	    Picks.remove({_id: pickId});
	}
    },

    'click #submit': function(event) {
    }
});

Template.yourName.events({
    'keyup #yourName, blur #yourName': function(event) {
	if (event.type === "keyup" && event.which === 13 ||
	    event.type === "blur") {
	    var value = event.target.value;
	    if (value) {
		Meteor.users.update({_id: Meteor.userId()}, {$set: {"profile.name": value}});
	    }
	    if (event.type != "blur") {event.target.blur()};
	}	    
    }
});

Template.yourName.namePlaceholder = function () {
    return Meteor.user().profile.name || "Name";
};

