/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';


/******************************************************************************
 * Application contants
 ******************************************************************************/

// Change the following value to your own following the instructions.
var OAUTH2_CLIENT_ID = 'PASTE_YOUR_OAUTH_CLIENT_ID_HERE';
var OAUTH2_SCOPES = ['https://www.googleapis.com/auth/youtube'];


/******************************************************************************
 * Angular module settings
 ******************************************************************************/

var channelTargeter = angular.module('channelTargeter', [
    'ngResource',
    'ngMaterial'
]);

/******************************************************************************
 * Controller
 ******************************************************************************/

/**
 * The constructor for the controller.
 *
 * @param {!angular.Scope} $scope
 * @param {angular.$location} $location
 * @param {!md.$dialog} $mdDialog
 * @param {!md.$anchorScroll} $anchorScroll
 * @struct
 * @constructor
 * @ngInject
 */
channelTargeter.Ctrl = function($scope, $location, $mdDialog, $anchorScroll) {
  this.location = $location;
  this.mdDialog = $mdDialog;
  this.anchorScroll = $anchorScroll;
  this.scope = $scope;

  this.selectedTab = 0;
  this.sections = null;
  this.sectionsLoaded = false;
  this.authentificated = false;
  this.channel = null;
  this.contentOwner = null;

  this.sectionTypes = [
      'allPlaylists',
      'completedEvents',
      'likedPlaylists',
      'likes',
      'liveEvents',
      'multipleChannels',
      'multiplePlaylists',
      'popularUploads',
      'postedPlaylists',
      'postedVideos',
      'recentActivity',
      'recentPosts',
      'recentUploads',
      'singlePlaylist',
      'subscriptions',
      'upcomingEvents'
  ];
  this.sectionStyles = [
      'horizontalRow',
      'verticalList'
  ];
  this.targetingTypes = [
      'languages',
      'regions',
      'countries'
  ];
  this.typesWithTitle = {
      multiplePlaylists: true,
      multipleChannels: true
  };
  this.typesWithContentDetails = {
    singlePlaylist: true,
    multiplePlaylists: true,
    multipleChannels: true
  };
  this.submit = {
      processing: false,
      current: 0,
      total: 0
  };
};

/**
 * Automatically load the user's owning channel id.
 */
channelTargeter.Ctrl.prototype.loadOwnChannelId = function() {
  var requestObj = {part: 'id', mine: true};
  var request = gapi.client.youtube.channels.list(requestObj);
  request.execute(function(response) {
    if (!this.handleErrorResponse(response)) {
      this.channel_id = response.items[0].id;
      this.scope.$apply();
    }
  }.bind(this));
};

/**
 * Load all channel sections of the channel.
 */
channelTargeter.Ctrl.prototype.onLoadSections = function() {
  this.sections = null;

  // Load basic channel info
  let requestObj = {part: 'contentDetails,snippet', id: this.channel_id};

  let request = gapi.client.youtube.channels.list(requestObj);
  request.execute(function(response) {
    if (!this.handleErrorResponse(response)) {
      this.channel = response.items[0];
      this.scope.$apply();
    }
  }.bind(this));

  // Load sections
  requestObj = {
    part: 'id,contentDetails,snippet,targeting',
    channelId: this.channel_id
  };
  if (this.contentOwner) {
    requestObj.onBehalfOfContentOwner = this.contentOwner;
  }

  request = gapi.client.youtube.channelSections.list(requestObj);
  request.execute(function(response) {
    if (!this.handleErrorResponse(response)) {
      this.onSectionsLoaded(response.items);
    }
  }.bind(this));
};

/**
 * Callback function when all sections are loaded.
 *
 * @param {Array<Object>} sections List of channelSection items.
 */

channelTargeter.Ctrl.prototype.onSectionsLoaded = function(sections) {
  this.sections = {};
  this.selectedTab = 2;
  this.sectionsLoaded = true;

  for (const section of sections) {
    this.sections[section.id] = section;

    section.snippet.originalPosition = section.snippet.position;
    if (section.contentDetails) {
      section.contentDetailsRaw =
          section.contentDetails.playlists ?
              section.contentDetails.playlists.join(', ') : [] ||
          section.contentDetails.channels ?
              section.contentDetails.channels.join(', ') : [];
    }

    if (section.targeting) {
      section.targetingRaw = {};
      for (const targetingType of this.targetingTypes) {
        if (section.targeting[targetingType]) {
          section.targetingRaw[targetingType] = {
            enabled: true,
            value: section.targeting[targetingType].join(', ')
          };
        }
      }
    }
  }
  this.scope.$apply();
};

/**
 * Determine whether the content details field of a section should be shown.
 *
 * @param {string} id ID of the section to remove.
 * @return {boolean} True if content detail field is valid for the section.
 */
channelTargeter.Ctrl.prototype.ifShowContentDetails = function(id) {
  return this.sections[id].snippet.type in this.typesWithContentDetails;
};

/**
 * Return whether the current channel's section list is empty.
 * @return {boolean}
 */
channelTargeter.Ctrl.prototype.isSectionListEmpty = function() {
  return angular.equals(this.sections, {});
};

/**
 * Event listener for channel section add.
 *
 */
channelTargeter.Ctrl.prototype.onSectionAdd = function() {
  this.showConfirm(
      'Confirmation',
      'Please submit any existing changes ' +
          'before adding a new section. Otherwise they will be lost.',
      function() {
        let requestObj = {
          part: 'snippet',
          resource: {
            snippet: {
              type: 'recentUploads',
              style: 'horizontalRow'
            }
          }
        };
        if (this.contentOwner) {
          requestObj.onBehalfOfContentOwner = this.contentOwner;
        }
        let request = gapi.client.youtube.channelSections.insert(requestObj);
        request.execute(function(response) {
          if (!this.handleErrorResponse(response)) {
            this.showConfirm(
                'Confirmation',
                'New section added. Reload section list? ' +
                    'All existing changes will be lost.',
                this.onLoadSections.bind(this));
          }
        }.bind(this));
      }.bind(this));
};

/**
 * Event listener for channel section removal.
 *
 * @param {string} id ID of the section to remove.
 */
channelTargeter.Ctrl.prototype.onSectionRemove = function(id) {
  this.showConfirm(
      'Confirmation',
      'Do you really want to remove this section?',
      function() {
        let requestObj = {
          id: id
        };
        if (this.contentOwner) {
          requestObj.onBehalfOfContentOwner = this.contentOwner;
        }
        let request = gapi.client.youtube.channelSections.delete(requestObj);
        request.execute(function(response) {
          if (!this.handleErrorResponse(response)) {
            this.showConfirm(
                'Confirmation',
                'Reload updated sections? Other existing changes will be lost.',
                this.onLoadSections.bind(this));
          }
        }.bind(this));
      }.bind(this));
};

/**
 * Event listener for the reset button.
 */
channelTargeter.Ctrl.prototype.onReset = function() {
  this.showConfirm(
      'Confirmation',
      'This will reset all the settings you\'ve made so far, continue anyway?',
      this.onLoadSections.bind(this), angular.noop);
};

/**
 * Event listener for the submit button.
 */
channelTargeter.Ctrl.prototype.onSubmit = function() {
  var usedPos = {};
  for (const section of Object.values(this.sections)) {
    var pos = section.snippet.position;
    if (usedPos[pos]) {
      this.showAlert('Error',
          'Position number ' + pos + ' must be unique across all sections!');
      return;
    } else {
      usedPos[pos] = true;
    }

    if (section.contentDetailsRaw) {
      var items = section.contentDetailsRaw.split(',').map(i => i.trim())
          .filter(i => i && i.length);
      switch (section.snippet.type) {
        case 'singlePlaylist':
          if (items.length > 1) {
            this.showAlert('Error',
                'Only 1 entry allowed for type singlePlaylist');
            return;
          }
          section.contentDetails = { playlists: items };
          break;
        case 'multiplePlaylists':
          section.contentDetails = { playlists: items };
          break;
        case 'multipleChannels':
          section.contentDetails = {channels: items};
          break;
      }
    }

    section.targeting = {};
    for (const type in section.targetingRaw) {
      if (!section.targetingRaw[type].enabled) {
        break;
      }
      var newValue;
      if (type === 'regions' || type === 'countries') {
          newValue = section.targetingRaw[type].value.toUpperCase();
        } else {
          newValue = section.targetingRaw[type].value.toLowerCase();
        }
      section.targeting[type] = newValue.split(',').map(i => i.trim())
          .filter(i => i && i.length);
    }
  }

  // Send requests
  this.location.hash('top');
  this.anchorScroll();

  var sectionList = Object.values(this.sections);
  this.submit.processing = true;
  this.submit.total = sectionList.length;
  this.submit.current = 0;

  var sectionList = Object.values(this.sections);

  var recursiveCallback = function(i, sectionList) {
    if (i == sectionList.length) {
      this.submit.processing = false;
      this.showConfirm(
          'Confirmation', 'Submission finished. Reload now to see the ' +
          'updated list?',
          this.onLoadSections.bind(this),
          angular.noop);
      return;
    }

    var requestObj = {
      part: 'id,contentDetails,snippet,targeting',
      resource: sectionList[i]
    };
    if (this.contentOwner) {
      requestObj.onBehalfOfContentOwner = this.contentOwner;
    }
    var request = gapi.client.youtube.channelSections.update(requestObj);
    request.execute(function(response) {
      if (!this.handleErrorResponse(response)) {
        this.submit.current += 1;
        this.scope.$apply();
        recursiveCallback(i + 1, sectionList);
      } else {
        this.submit.processing = false;
      }
    }.bind(this));
  }.bind(this);

  recursiveCallback(0, sectionList);
};

/**
 * Show confirm dialog with message.
 *
 * @param {string} title
 * @param {string} text
 * @param {string} callbackSuccess Callback in case of positive response.
 */
channelTargeter.Ctrl.prototype.showConfirm = function(
    title, text, callbackSuccess) {
  let confirm = this.mdDialog.confirm()
                    .title(title)
                    .textContent(text)
                    .ariaLabel(text)
                    .targetEvent(null)
                    .ok('OK')
                    .cancel('Cancel');

  this.mdDialog.show(confirm).then(callbackSuccess, angular.noop);
};

/**
 * Show dialog with alert message.
 *
 * @param {string} title
 * @param {string} text
 */
channelTargeter.Ctrl.prototype.showAlert = function(title, text) {
  this.mdDialog.show(this.mdDialog.alert()
      .parent(angular.element(document.body))
      .clickOutsideToClose(true)
      .title(title)
      .textContent(text)
      .ariaLabel(text)
      .targetEvent(null)
      .ok('OK'));
};

/**
 * Handler when error occurs in API response.
 *
 * @param {Object} response Response from the API call.
 * @return {boolean} True if error in response.
 */
channelTargeter.Ctrl.prototype.handleErrorResponse = function(response) {
  if (response.error) {
    console.error(response);
    this.showAlert('Error in API call', response.error.message);
    return true;
  }
  return false;
};

/**
 * Event listener of the authorize button
 */
channelTargeter.Ctrl.prototype.onAuthorize = function() {
  gapi.auth.authorize(
      {client_id: OAUTH2_CLIENT_ID, scope: OAUTH2_SCOPES, immediate: false},
      function(authResult) {
        this.handleAuthResult(authResult);
        this.selectedTab = 1;
      }.bind(this));
};

/**
 * Event listener to revoke previous authentication
 */
channelTargeter.Ctrl.prototype.onRevokeAccess = function() {
  let token = gapi.auth.getToken();
  if (token) {
    window.open(
        'https://accounts.google.com/o/oauth2/revoke?token=' +
        token.access_token);
  } else {
    gapi.auth.authorize(
        {client_id: OAUTH2_CLIENT_ID, scope: OAUTH2_SCOPES, immediate: false},
        this.revokeAccessInternal.bind(this));
  }
};

/**
 * Revoke previous authentication.
 *
 * @param {Object} authResult Result from the gapi.auth.authorize().
 */
channelTargeter.Ctrl.prototype.revokeAccessInternal = function(authResult) {
  if (authResult && !authResult.error) {
    window.open(
        'https://accounts.google.com/o/oauth2/revoke?token=' +
        authResult.access_token);
  } else {
    this.showAlert('Error', 'Authentication error!');
  }
};

/**
 * After the API loads, enable other tabs and prefill the channel id.
 */
channelTargeter.Ctrl.prototype.handleAPILoaded = function() {
  this.authentificated = true;
  this.scope.$apply();
  this.loadOwnChannelId();
};

/**
 * Attempt the immediate OAuth 2.0 client flow as soon as the page loads.
 * If the currently logged-in Google Account has previously authorized
 * the client specified as the OAUTH2_CLIENT_ID, then the authorization
 * succeeds with no user intervention. Otherwise, it fails and the
 * user interface that prompts for authorization needs to display.
 */
channelTargeter.Ctrl.prototype.checkAuth = function() {
  gapi.auth.authorize({
    client_id: OAUTH2_CLIENT_ID,
    scope: OAUTH2_SCOPES,
    immediate: true
  }, this.handleAuthResult.bind(this));
};

/**
 * Handle the result of a gapi.auth.authorize() call.
 * @param {Object} authResult Result from the gapi.auth.authorize().
 */
channelTargeter.Ctrl.prototype.handleAuthResult = function(authResult) {
  if (authResult && !authResult.error) {
    // Load the client interfaces for the YouTube Analytics and Data APIs,
    // which are required to use the Google APIs JS client. More info is
    // available at
    // https://developers.google.com/api-client-library/javascript/dev
    gapi.client.load('youtube', 'v3', this.handleAPILoaded.bind(this));
  } else {
    this.showAlert('Error', 'Authentication error!');
  }
};


channelTargeter.controller('ChannelTargeterCtrl', channelTargeter.Ctrl);
