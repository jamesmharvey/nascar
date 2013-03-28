var newCurrentRace = function () {
    Races.update({thisweek: true}, {$unset: {thisweek: ''}}, {multi: true});
    var now = new Date();
    var nextTue = new Date(now.valueOf() + timeToTuesday(now));
    var prevTue = new Date(nextTue.valueOf() - 7*24*60*60*1000);
    Races.update({$and: [{date: {$gt: prevTue}}, {date: {$lt: nextTue}}]}, {$set: {thisweek: true}});
    Races.update({date: {$lt: prevTue}}, {$set: {oldRace: true}}, {multi: true});
};
var setRaceInterval = function () {Meteor.setInterval (newCurrentRace, 7*24*60*60*1000)};
var set38s = function () {
    var need38s = Races.find({$and: [{date: {$lt: new Date()}}, {qual38: {$exists: false}}]}).fetch();
    for (i=0; i<need38s.length; i++) {
	var race = need38s[i]; 
	var yahooId = race.yahooId; 
	var qualHTML = Meteor.http.get("http://sports.yahoo.com/nascar/sprint/races/" + yahooId + "/qualify");
	if (qualHTML.content.match(/38<\/th>[^\(]*\>([^\<]*)<\/a> \(/)) {
	    var driver38 = RegExp.$1;
	    Races.update({yahooId: yahooId}, {$set: {qual38: driver38}});
	    var ownersWithPicks = _.map(Picks.find({$and: [{racename: race.raceId}, {pick: {$not: ""}}]}).fetch(), function (pick) {return pick.owner});
	    var allOwners = _.map(Meteor.users.find().fetch(),function (user) {return user._id});
	    var ownersWithoutPicks = _.difference(allOwners,ownersWithPicks);
	    for (j=0; j<ownersWithoutPicks.length; j++) {
		Picks.insert({owner: ownersWithoutPicks[j], racename: race.raceId, pick: driver38, autopick: "No Pick"});
	    }
	}
    }
};

var getFinish = function (yahooId) {
    var finishHTML = Meteor.http.get("http://sports.yahoo.com/nascar/sprint/races/" + yahooId + "/results");
    return finishHTML;
};

Meteor.startup(function () {
    Meteor.publish("drivers", function () {
	return Drivers.find(); // everything
    });

    Meteor.publish("races", function () {
	return Races.find(); // everything
    });

    Meteor.publish("picks", function () {
	var pastRaces = Races.find({date: {$lt: new Date()}}).map(function (race) {return race.raceId});
	var userId = this.userId;
	return Picks.find({$or: [{owner: userId}, {racename: {$in: pastRaces}}]});
    });

    Meteor.publish("futurepicks", function () {
	return Picks.find({},{fields: {pick: 0}});
    });
    
    Meteor.publish("allUserData", function () {
	return Meteor.users.find({});
    });


    if (Races.find().count() === 0) {
	var races = [["Sunday","24-Feb","Daytona 500","Daytona",1,1],["Sunday","3-Mar","Subway 500","Phoenix",1,53],["Sunday","10-Mar","Kobalt Tools 400","Las Vegas",1,28],["Sunday","17-Mar","Ford City 500","Bristol",1,31],["Sunday","24-Mar","Auto Club 400","Fontana",1,26],["Sunday","7-Apr","Virginia 500","Martinsville",1,15],["Saturday","13-Apr","Texas 500","Texas",1,32],["Sunday","21-Apr","STP 400","Kansas",1,55],["Saturday","27-Apr","Toyota 400","Richmond",1,5],["Sunday","5-May","Aaron's 499","Talladega",1,22],["Saturday","11-May","Southern 500","Darlington",1,30],["Sunday","26-May","Coca-Cola 600","Charlotte",1,3],["Sunday","2-Jun","Dover 400","Dover",2,4],["Sunday","9-Jun","Pocono 400","Pocono",2,7],["Sunday","16-Jun","Quicken 400","Michigan",2,6],["Sunday","23-Jun","Toyota/Save Mart 350","Sonoma",2,8],["Saturday","29-Jun","Quaker State 400","Kentucky",2,56],["Saturday","6-Jul","Coke Zero 400","Daytona",2,9],["Sunday","14-Jul","New Hampshire 300","New Hampshire",2,10],["Sunday","28-Jul","Crown Royal 400","Indianapolis",2,12],["Sunday","4-Aug","Pennsylvania 400","Pocono",2,11],["Sunday","11-Aug","Cheez-It 355 at the Glen","Watkins Glen",2,13],["Sunday","18-Aug","Pure Michigan 400","Michigan",2,14],["Saturday","24-Aug","Irwin Tools Night Race","Bristol",2,16],["Sunday","1-Sep","AdvoCare (1) 500","Atlanta",2,25],["Saturday","7-Sep","Fed Auto Parts 400","Richmond",2,18],["Sunday","15-Sep","Geico 400","Chicagoland",3,38],["Sunday","22-Sep","Sylvania 300","New Hampshire",3,33],["Sunday","29-Sep","AAA 400","Dover",3,19],["Sunday","6-Oct","Hollywood Casino 400","Kansas",3,39],["Saturday","12-Oct","B of A 500","Charlotte",3,21],["Sunday","20-Oct","Camping World 500","Talladega",3,41],["Sunday","27-Oct","Goody's 500","Martinsville",3,20],["Sunday","3-Nov","AAA Texas 500","Texas",3,54],["Sunday","10-Nov","AdvoCare (2) 500","Phoenix",3,23],["Sunday","17-Nov","Ford 400","Homestead",3,42]];
	for (var i = 0; i < races.length; i++){
	    var dateString;
	    if (races[i][0] == "Saturday") {
		dateString = "12:00 EDT " + races[i][1] + " 2013";
	    }
	    else {
		dateString = "1:00 EDT " + races[i][1] + " 2013";
	    }
	    Races.insert({name: races[i][2],
			  raceId: races[i][2].replace(/\W/g,''),
			  date: new Date(dateString),
			  track: races[i][3],
			  seasonPart: races[i][4],
			  yahooId: races[i][5],
			  raceNumber: i+1});
	}
    };

    if (Drivers.find().count() === 0) {
	var drivers = ["J McMurray",
		       "Brad Keselowski",
		       "K Kahne",
		       "D Blaney",
		       "M Ambrose",
		       "D Patrick",
		       "D Hamlin",
		       "C Mears",
		       "T Stewart",
		       "C Bowyer",
		       "G Biffle",
		       "R Stenhouse",
		       "Ky Busch",
		       "M Bliss",
		       "M Kenseth",
		       "T Bayne",
		       "J Logano",
		       "J Gordon",
		       "P Menard",
		       "K Harvick",
		       "D Stremme",
		       "J Burton",
		       "K Schrader",
		       "T Hill",
		       "T Labonte",
		       "A Dillon",
		       "T Dillon",
		       "D Ragan",
		       "J Wise",
		       "JJ Yeley",
		       "D Gilliland",
		       "R Newman",
		       "JP Montoya",
		       "A Almirola",
		       "B Labonte",
		       "J Johnson",
		       "AJ Allmendinger",
		       "R Smith",
		       "R Truex",
		       "Brian Keselowski",
		       "B Vickers",
		       "M Martin",
		       "M Waltrip",
		       "M Truex Jr",
		       "Ku Busch",
		       "D Reutimann",
		       "J Nemechek",
		       "D Earnhadt Jr",
		       "T Kvapil",
		       "S Speed",
		       "M McDowell",
		       "C Edwards"];
	for (var i = 0; i < drivers.length; i++)
            Drivers.insert({name: drivers[i]});
    };

    Meteor.setTimeout(function () {newCurrentRace(); setRaceInterval()}, timeToTuesday(new Date()));
    Meteor.autorun(newCurrentRace);
    
    Meteor.autorun(set38s);

    Meteor.methods({
	editpick: function (userName, raceNumber, selectedDriver) {
	    var userId = Meteor.users.findOne({$or: [{"profile.name": userName}, {"emails.0.address": userName}]})._id;
	    var callerId = this.userId
	    if (callerId === "u8A3sZzAqA3AXc7x8" || callerId === "xrhtrBSMe9qjEqXrb")
	    {
		var raceId = Races.findOne({raceNumber: raceNumber}).raceId;
		if (!Picks.find({owner: userId, racename: raceId}).count()) {
		    Picks.insert({owner: userId, racename: raceId, pick: selectedDriver});
		}
		else {
		    Picks.update({owner: userId, racename: raceId}, {$set: {pick: selectedDriver}})
		}
	    }
	},
	commpick: function (ownerId,raceId,selectedDriver) {
	    var commissionerIds = ["u8A3sZzAqA3AXc7x8", "xrhtrBSMe9qjEqXrb", "dyxgi5q749ctmFB78"];
	    if (1 + _.indexOf(commissionerIds, Meteor.userId())) {
		if (!Picks.find({owner: ownerId, racename: raceId}).count()) {
		    console.log(selectedDriver, "boo");
		    Picks.insert({owner: ownerId, racename: raceId, pick: selectedDriver, autopick: "commissioner"});
		}
		else {
		    console.log(selectedDriver, "bah");
		    Picks.update({owner: ownerId, racename: raceId}, {$set: {pick: selectedDriver, autopick: "commissioner"}})
		}	      
	    }
	},	  
	get: function (yahooId) {
	    return 500;
	    return Meteor.http.get("http://sports.yahoo.com/nascar/sprint/races/" + yahooId + "/qualify");
	}

    });

    // code to run on server at startup
});
