Drivers = new Meteor.Collection("drivers");
Races = new Meteor.Collection("races");
Picks = new Meteor.Collection("picks");

//permissions
Picks.allow({
    insert: function (userId, doc) {
    // the user must be logged in, and the document must be owned by the user
	return (userId && doc.owner === userId);
    },
    update: function (userId, docs, fields, modifier) {
    // can only change your own documents
	return _.all(docs, function(doc) {
	    return doc.owner === userId;
	});
    },
    remove: function (userId, docs) {
    // can only remove your own documents
	return _.all(docs, function(doc) {
	    return doc.owner === userId;
	});
    },
    fetch: ['owner']
});

Picks.deny({
    update: function (userId, docs, fields, modifier) {
    // can't change owners
	return _.contains(fields, 'owner');
    },
    remove: function (userId, docs) {
    // can't remove locked documents
	return _.any(docs, function (doc) {
	    return doc.locked;
	});
    },
    fetch: ['locked'] // no need to fetch 'owner'
});


if (Meteor.isClient) {



    Template.races.race = function () {
	return Races.find({}, {sort: {raceNumber: 1}});
    };

    Template.race.locked = function () {
	var raceDate = this.date;
	return raceDate < new Date();
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
	var userId = Meteor.user()._id;
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


    Template.race.events({
	'change select': function(event) {
	    var userId = Meteor.user()._id;
	    var raceId = event.currentTarget.getAttribute("id");
	    var selectedDriver = event.currentTarget.value;
	    if (!Picks.find({owner: userId, racename: raceId}).count()) {
		Picks.insert({owner: userId, racename: raceId, pick: selectedDriver});
	    }
	    else {
		Picks.update({owner: userId, racename: raceId}, {$set: {pick: selectedDriver}})
	    }
	}
    });
}



if (Meteor.isServer) {
  Meteor.startup(function () {
      Accounts.onCreateUser(function(options, user) {
          if (options.profile) {
              user.profile = options.profile;
          }
          user._id = (new Meteor.Collection.ObjectID())._str;
          return user;
      });


      if (Races.find().count() === 0) {
      var races = [["Sunday","24-Feb","Daytona 500","Daytona",1],
		   ["Sunday","3-Mar","Subway 500","Phoenix",1],
		   ["Sunday","10-Mar","Kobalt Tools 400","Las Vegas",1],
		   ["Sunday","17-Mar","Ford City 500","Bristol",1],
		   ["Sunday","24-Mar","Auto Club 400","Fontana",1],
		   ["Sunday","7-Apr","Virginia 500","Martinsville",1],
		   ["Saturday","13-Apr","Texas 500","Texas",1],
		   ["Sunday","21-Apr","STP 400","Kansas",1],
		   ["Saturday","27-Apr","Toyota 400","Richmond",1],
		   ["Sunday","5-May","Aaron\'s 499","Talladega",1],
		   ["Saturday","11-May","Southern 500","Darlington",1],
		   ["Sunday","26-May","Coca-Cola 600","Charlotte",1],
		   ["Sunday","2-Jun","Dover 400","Dover",2],
		   ["Sunday","9-Jun","Pocono 400","Pocono",2],
		   ["Sunday","16-Jun","Quicken 400","Michigan",2],
		   ["Sunday","23-Jun","Toyota/Save Mart 350","Sonoma",2],
		   ["Saturday","29-Jun","Quaker State 400","Kentucky",2],
		   ["Saturday","6-Jul","Coke Zero 400","Daytona",2],
		   ["Sunday","14-Jul","New Hampshire 300","New Hampshire",2],
		   ["Sunday","28-Jul","Crown Royal 400","Indianapolis",2],
		   ["Sunday","4-Aug","Pennsylvania 400","Pocono",2],
		   ["Sunday","11-Aug","Cheez-It 355 at the Glen","Watkins Glen",2],
		   ["Sunday","18-Aug","Pure Michigan 400","Michigan",2],
		   ["Saturday","24-Aug","Irwin Tools Night Race","Bristol",2],
		   ["Sunday","1-Sep","AdvoCare (1) 500","Atlanta",2],
		   ["Saturday","7-Sep","Fed Auto Parts 400","Richmond",2],
		   ["Sunday","15-Sep","Geico 400","Chicagoland",3],
		   ["Sunday","22-Sep","Sylvania 300","New Hampshire",3],
		   ["Sunday","29-Sep","AAA 400","Dover",3],
		   ["Sunday","6-Oct","Hollywood Casino 400","Kansas",3],
		   ["Saturday","12-Oct","B of A 500","Charlotte",3],
		   ["Sunday","20-Oct","Camping World 500","Talladega",3],
		   ["Sunday","27-Oct","Goody\'s 500","Martinsville",3],
		   ["Sunday","3-Nov","AAA Texas 500","Texas",3],
		   ["Sunday","10-Nov","AdvoCare (2) 500","Phoenix",3],
		   ["Sunday","17-Nov","Ford 400","Homestead",3]];
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
			    raceNumber: i+1}); 
	  }
      }

  
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
      }

    // code to run on server at startup
  });
}
