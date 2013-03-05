/*
 * Foodwatcher Bot
 *
 * "A little Google Talk bot which delivers the information from the Foodwatcher service.
 *
 * Copyright(c) 2013 André König <andre.koenig@gmail.com>
 * MIT Licensed
 *
 */

var moment = require('moment'),
	supplier = require('./supplier')();

module.exports = function () {
	'use strict';

	var privates = {},
		MESSAGES;

	MESSAGES = {
		NO_DATA: "_Keine Daten verfügbar!_\n\nFür den angefragten Zeitraum liegen im Moment noch keine Daten vor. Versuche es später noch einmal.",
		CLOSED:  "_WOCHENENDE!!_\n\nDie Mensa ist zum angefragten Zeitpunkt leider geschlossen. Genieße das Wochenende!"
	};

	privates.executeServiceCommand = function (command, cb) {
		switch (command.type) {
			case 'mensen':
				supplier.getMensen(cb);
			break;
		}
	};

	privates.executeMealCommand = function (command, cb) {
		var day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(command.type),
			currentDay = moment().day(),
			isNextWeek = false;

		// If the user entered a weekday, like 'monday', 'tuesday' etc., everything
		// is fine. Otherwise we have to determine the day of the week by interpreting
		// the 'today', 'tomorrow', 'dayAfterTomorrow' keyword.
		if (day === -1) {
			switch (command.type) {
				case 'today':
					day = moment().day();
				break;

				case 'tomorrow':
					day = moment().day(currentDay + 1).format('d');
					isNextWeek = (currentDay + 1) > 6;
				break;

				case 'dayAfterTomorrow':
					day = moment().day(currentDay + 2).format('d');
					isNextWeek = (currentDay + 2) > 6;
				break;
			}
		}

		// Check if the specified day is a Saturday or Sunday.
		if (/0|6/.test(day)) {
			cb(MESSAGES.CLOSED);
		} else if (isNextWeek) {
			cb(MESSAGES.NO_DATA);
		} else {
			supplier.getMeals(day, command.mensa, function (err, meals) {

				if (err) {
					cb(err);
					return;
				}
				cb(err, meals);
			});
		}
	}

	return {
		treat : function (command, cb) {
			if (/^help$|^mensen$/.test(command.type)) {
				privates.executeServiceCommand(command, cb);
			} else {
				privates.executeMealCommand(command, cb)
			}
		}
	};
};