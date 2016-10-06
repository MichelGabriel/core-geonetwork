/*
 * Copyright (C) 2001-2016 Food and Agriculture Organization of the
 * United Nations (FAO-UN), United Nations World Food Programme (WFP)
 * and United Nations Environment Programme (UNEP)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA
 *
 * Contact: Jeroen Ticheler - FAO - Viale delle Terme di Caracalla 2,
 * Rome - Italy. email: geonetwork@osgeo.org
 */

(function() {

  goog.provide('gn_search_swe');






  goog.require('cookie_warning');
  goog.require('gn_related_directive');
  goog.require('gn_resultsview');
  goog.require('gn_search');
  goog.require('swe_directives');
  goog.require('swe_search_config');

  var module = angular.module('gn_search_swe', [
    'gn_related_directive', 'gn_search',
    'gn_resultsview', 'cookie_warning',
    'swe_search_config', 'swe_directives', 'ngStorage',
    'angulartics', 'angulartics.google.tagmanager', 'angulartics.debug']);

  module.controller('gnsSwe', [
    '$rootScope',
    '$scope',
    '$localStorage',
    '$location',
    'suggestService',
    '$http',
    '$compile',
    '$window',
    '$translate',
    '$timeout',
    'gnUtilityService',
    'gnSearchSettings',
    'gnViewerSettings',
    'gnMap',
    'gnMdView',
    'gnMdViewObj',
    'gnWmsQueue',
    'gnSearchLocation',
    'gnOwsContextService',
    'hotkeys',
    'gnGlobalSettings',
    'gnMdFormatter',
    function($rootScope, $scope, $localStorage, $location, suggestService,
             $http, $compile, $window, $translate, $timeout,
             gnUtilityService, gnSearchSettings, gnViewerSettings,
             gnMap, gnMdView, mdView, gnWmsQueue,
             gnSearchLocation, gnOwsContextService,
             hotkeys, gnGlobalSettings, gnMdFormatter) {

      var viewerMap = gnSearchSettings.viewerMap;
      var searchMap = gnSearchSettings.searchMap;

      $scope.viewMode = 'full';

      $scope.formatter = gnSearchSettings.formatter;
      $scope.modelOptions = angular.copy(gnGlobalSettings.modelOptions);
      $scope.modelOptionsForm = angular.copy(gnGlobalSettings.modelOptions);
      $scope.modelOptionsFormGeo = angular.copy(gnGlobalSettings.modelOptions);
      $scope.gnWmsQueue = gnWmsQueue;
      $scope.$location = $location;
      $scope.activeTab = '/search';
      $scope.resultTemplate = gnSearchSettings.resultTemplate;
      $scope.facetsSummaryType = gnSearchSettings.facetsSummaryType;
      $scope.location = gnSearchLocation;

      $scope.$on('someEvent', function(event, map) {
        alert('event received. url is: ' + map.url);

      });

      $scope.$on('search', function() {
        $scope.triggerSearch();
      });

      // prevent the floating map from positioning on top of the footer
      $scope.affixFloatingMap = function() {
        
        $(window).scroll(function (event) {
          var windowTop = $(this).scrollTop() + $(window).height();     

          if (windowTop >= $('.footer').offset().top) {
            $('.floating-map-cont').addClass('affix-bottom');
          } else {
            $('.floating-map-cont').removeClass('affix-bottom');
          }
        });
      };


      $rootScope.$on('$includeContentLoaded', function() {
        $timeout($scope.affixFloatingMap());
      });
      
      $scope.toggleMap = function() {
        $(searchMap.getTargetElement()).toggle();
      };

      /**
       * Toogle a favorite metadata selection.
       *
       * @param {number} id  Metadata identifier
         */
      $scope.toggleFavorite = function(id) {
        if ($localStorage.favoriteMetadata == undefined) {
          $localStorage.favoriteMetadata = [];
        }

        var pos = $localStorage.favoriteMetadata.indexOf(id);

        if (pos > -1) {
          $localStorage.favoriteMetadata.splice(pos, 1);
        } else {
          $localStorage.favoriteMetadata.push(id);
        }
      };

      /**
       * Checks if a metadata is in the favorite selection.
       *
       * @param {number} id Metadata identifier
       * @return {boolean}
         */
      $scope.containsFavorite = function(id) {
        if ($localStorage.favoriteMetadata == undefined) {
          $localStorage.favoriteMetadata = [];
        }

        var pos = $localStorage.favoriteMetadata.indexOf(id);

        return (pos > -1);
      };

      hotkeys.bindTo($scope)
          .add({
            combo: 'h',
            description: $translate('hotkeyHome'),
            callback: function(event) {
              $location.path('/home');
            }
          }).add({
            combo: 't',
            description: $translate('hotkeyFocusToSearch'),
            callback: function(event) {
              event.preventDefault();
              var anyField = $('#gn-any-field');
              if (anyField) {
                gnUtilityService.scrollTo();
                $location.path('/search');
                anyField.focus();
              }
            }
          }).add({
            combo: 'enter',
            description: $translate('hotkeySearchTheCatalog'),
            allowIn: 'INPUT',
            callback: function() {
              $location.search('tab=search');
            }
            //}).add({
            //  combo: 'r',
            //  description: $translate('hotkeyResetSearch'),
            //  allowIn: 'INPUT',
            //  callback: function () {
            //    $scope.resetSearch();
            //  }
          }).add({
            combo: 'm',
            description: $translate('hotkeyMap'),
            callback: function(event) {
              $location.path('/map');
            }
          });


      // TODO: Previous record should be stored on the client side
      $scope.mdView = mdView;
      gnMdView.initMdView();
      $scope.goToSearch = function(any) {
        $location.path('/search').search({'any': any});
      };
      $scope.canEdit = function(record) {
        // TODO: take catalog config for harvested records
        if (record && record['geonet:info'] &&
            record['geonet:info'].edit == 'true') {
          return true;
        }
        return false;
      };
      $scope.openRecord = function(index, md, records) {
        gnMdView.feedMd(index, md, records);
      };

      $scope.closeRecord = function() {
        gnMdView.removeLocationUuid();
      };
      $scope.nextRecord = function() {
        // TODO: When last record of page reached, go to next page...
        $scope.openRecord(mdView.current.index + 1);
      };
      $scope.previousRecord = function() {
        $scope.openRecord(mdView.current.index - 1);
      };


      /**
       * Returns an array of map links for a metadata.
       *
       * @param {object} md
       * @return {Array}
         */
      $scope.getMapLinks = function(md) {
        var links = [];

        if (md == null) return links;

        for (var t in gnSearchSettings.linkTypes.layers) {
          var d = md.getLinksByType(gnSearchSettings.linkTypes.layers[t]);

          if (d.length > 0) {
            links = links.concat(d);
          }
        }

        return links;
      };


      /**
       * Returns an array of download links for a metadata.
       *
       * @param {object} md
       * @return {Array}
       */
      $scope.getDownloadLinks = function(md) {
        var downloads = [];

        if (md == null) return downloads;

        for (var t in gnSearchSettings.linkTypes.downloads) {
          var d = md.getLinksByType(gnSearchSettings.linkTypes.downloads[t]);

          if (d.length > 0) {
            downloads = downloads.concat(d);
          }
        }

        return downloads;
      };


      /**
       * Returns an array of information links for a metadata.
       *
       * @param {object} md
       * @return {Array}
       */
      $scope.getInformationLinks = function(md) {
        var information = [];

        if (md == null) return information;

        for (var t in gnSearchSettings.linkTypes.links) {
          var d = md.getLinksByType(gnSearchSettings.linkTypes.links[t]);

          if (d.length > 0) {
            information = information.concat(d);
          }
        }

        return information;
      };

      $scope.infoTabs = {
        lastRecords: {
          title: 'lastRecords',
          titleInfo: '',
          active: true
        },
        preferredRecords: {
          title: 'preferredRecords',
          titleInfo: '',
          active: false
        }};

      // Set the default browse mode for the home page
      $scope.$watch('searchInfo', function() {
        if (angular.isDefined($scope.searchInfo.facet)) {
          if ($scope.searchInfo.facet['inspireThemes'].length > 0) {
            $scope.browse = 'inspire';
          } else if ($scope.searchInfo.facet['topicCats'].length > 0) {
            $scope.browse = 'topics';
            //} else if ($scope.searchInfo.facet['categories'].length > 0) {
            //  $scope.browse = 'cat';
          }
        }
      });


      $scope.resultviewFns = {
        addMdLayerToMap: function(link, md) {

          if (gnMap.isLayerInMap(viewerMap,
              link.name, link.url)) {
            return;
          }
          gnMap.addWmsFromScratch(viewerMap, link.url, link.name, false, md);
        },
        addWmsLayersFromCap: function(url, md) {
          // Open the map panel
          $scope.showMapPanel();

          var name = 'layers';
          var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
          var layersList = match &&
              decodeURIComponent(match[1].replace(/\+/g, ' '));

          if (layersList) {
            layersList = layersList.split(',');

            for (var i = 0; i < layersList.length; i++)
              if (!gnMap.isLayerInMap(viewerMap,
                  layersList[i], url)) {
                gnMap.addWmsFromScratch(viewerMap, url, layersList[i],
                    false, md);
              }
          } else {
            gnMap.addWmsAllLayersFromCap(viewerMap, url, false);
          }

        },
        addAllMdLayersToMap: function(layers, md) {
          angular.forEach(layers, function(layer) {
            $scope.resultviewFns.addMdLayerToMap(layer, md);
          });
        },
        loadMap: function(map) {
          gnOwsContextService.loadContextFromUrl(map.url, viewerMap);
        }
      };

      // Manage route at start and on $location change
      if (!$location.path()) {
        $location.path('/search');
      }
      $scope.activeTab = $location.path().
          match(/^(\/[a-zA-Z0-9]*)($|\/.*)/)[1];


      $scope.activateTabs = function() {
        // activate tabs
        $('#tab-result-nav a').click(function (e) {
          e.preventDefault();
          $(this).tab('show');
        });
        // hide empty
        $('#tab-result-nav a').each(function() {
          if ($($(this).attr('href')).length === 0) {
            $(this).parent().hide();
          }
        });
        // show the first
        $('#tab-result-nav a:first').tab('show');
      };   

      $scope.showMetadata = function(index, md, records) {
        angular.element('.geodata-row-popup').addClass('show');
        $scope.$emit('body:class:add', 'show-overlay');
        gnMdView.feedMd(index, md, records);

        var mdUrl = 'md.format.xml?xsl=xsl-view&view=full-view-swe&uuid={{uuid}}'; // + md['geonet:info'].uuid;
        // set scope md
        $scope.md = md;

        gnMdFormatter.getFormatterUrl(mdUrl, $scope, md['geonet:info'].uuid).then(function(url) {
          $http.get(url).then(
            function(response) {
              var snippet = response.data.replace(
                  '<?xml version="1.0" encoding="UTF-8"?>', '');

              $('#gn-metadata-display').find('*').remove();

              //$scope.compileScope.$destroy();

              // Compile against a new scope
              $scope.compileScope = $scope.$new();
              var content = $compile(snippet)($scope.compileScope);

              $('#gn-metadata-display').append(content);

              $scope.activateTabs();       
            });
          });

      };

      /**
       * Displays the metadata BBOX in the search map.
       *
       * @param {object} md  Metadata
         */
      $scope.showMetadataGeometry = function(md) {
        var feature = gnMap.getBboxFeatureFromMd(md,
            $scope.searchObj.searchMap.getView().getProjection());


        if (angular.isUndefined($scope.vectorLayer)) {
          var vectorSource = new ol.source.Vector({
            features: []
          });

          $scope.vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: gnSearchSettings.olStyles.mdExtentHighlight
          });

          $scope.searchObj.searchMap.addLayer($scope.vectorLayer);
        }

        $scope.vectorLayer.getSource().clear();
        $scope.vectorLayer.getSource().addFeature(feature);

      };

      /**
       * Displays the polygon in map.
       *
       */
      $scope.drawPolygonInMap = function() {
        var namesearch = $scope.searchObj.params.namesearch;
        var coordinates = namesearch.Coordinates;

        if (coordinates) {
          var proj = $scope.searchObj.searchMap.getView().getProjection();

          var xy0 = coordinates[0];
          var xy1 = coordinates[1];
          var extent = []; // geoBox=10.59|55.15|24.18|69.05
          extent.push([parseFloat(xy0.X), parseFloat(xy0.Y),
            parseFloat(xy1.X), parseFloat(xy1.Y)]);

          var feature = new ol.Feature();
          //var feature = gnMap.getPolygonFeature(namesearch, $scope.searchObj.searchMap.getView().getProjection());

          // Build multipolygon from the set of bboxes
          geometry = new ol.geom.MultiPolygon(null);
          for (var j = 0; j < extent.length; j++) {
            // TODO: Point will not be supported in multi geometry
            var projectedExtent =
                ol.extent.containsExtent(
                    proj.getWorldExtent(),
                    extent[j]) ?
                    ol.proj.transformExtent(extent[j], 'EPSG:4326', proj) :
                    extent[j];

            projectedExtent = extent[j];
            var coords =
                [
                  [
                    [projectedExtent[0], projectedExtent[1]],
                    [projectedExtent[0], projectedExtent[3]],
                    [projectedExtent[2], projectedExtent[3]],
                    [projectedExtent[2], projectedExtent[1]],
                    [projectedExtent[0], projectedExtent[1]]
                  ]
                ];
            geometry.appendPolygon(new ol.geom.Polygon(coords));
          }

          feature.setGeometry(geometry);

          if (angular.isUndefined($scope.vectorLayer)) {
            var vectorSource = new ol.source.Vector({
              features: []
            });

            $scope.vectorLayer = new ol.layer.Vector({
              source: vectorSource,
              style: gnSearchSettings.olStyles.mdExtentHighlight
            });

            $scope.searchObj.searchMap.addLayer($scope.vectorLayer);
          }
          $scope.vectorLayer.getSource().clear();
          $scope.vectorLayer.getSource().addFeature(feature);

          return true; // always return true so search query is fired.

        } else {
          return false; // always return false if cooridinates are absent. Not sure if we shall still return true.
        }
    };

      /**
       * Show full view results.
       */
      $scope.setFullViewResults = function() {
        angular.element('.geo-data-row').removeClass('compact-view');
        angular.element('.detail-view').addClass('active');
        angular.element('.compact-view').removeClass('active');
        $scope.viewMode = 'full';
      };

      /**
       * Show compact view results.
       */
      $scope.setCompactViewResults = function() {
        angular.element('.geo-data-row').addClass('compact-view');
        angular.element('.compact-view').addClass('active');
        angular.element('.detail-view').removeClass('active');
        $scope.viewMode = 'compact';
      };

      /**
       * Show map panel.
       */
      $scope.showMapPanel = function() {
        angular.element('.floating-map-cont').hide();
        $scope.$emit('body:class:add', 'small-map-view');
      };

      /**
       * Hide map panel.
       */
      $scope.hideMapPanel = function() {
        angular.element('.floating-map-cont').show();
        $scope.$emit('body:class:remove', 'small-map-view');
        $scope.$emit('body:class:remove', 'full-map-view');
        $scope.$emit('body:class:remove', 'medium-map-view');
      };

      $scope.resizeMapPanel = function() {
        var $b = angular.element(document).find('body');
        window_width = angular.element($window).width(),
        $map_data_list_cont = angular.element('.map-data-list-cont'),
        is_side_data_bar_open =
            ($map_data_list_cont.hasClass('open')) ? true : false,
        is_full_view_map = ($b.hasClass('full-map-view')) ? true : false,
        $data_list_cont = angular.element('.data-list-cont'),
        $map_cont = angular.element('.map-cont'),
        $obj = angular.element('#map-panel-resize');

        if (is_full_view_map) {
          if (is_side_data_bar_open) {
            $scope.$emit('body:class:remove', 'full-map-view');
            $scope.$emit('body:class:add', 'medium-map-view');
          } else {
            $scope.$emit('body:class:remove', 'full-map-view');
            $scope.$emit('body:class:add', 'small-map-view');
          }

          $obj.removeClass('small').addClass('full');
        } else {
          $scope.$emit('body:class:remove', 'medium-map-view');
          $scope.$emit('body:class:remove', 'small-map-view');
          $scope.$emit('body:class:add', 'full-map-view');

          if (is_side_data_bar_open) {
            $map_cont.css({
              width: (window_width - $data_list_cont.width())
            });
          } else {
            $map_cont.css({
              width: window_width
            });
          }
          $obj.removeClass('full').addClass('small');
        }

        // Refresh the viewer map

        $timeout(function() {
          viewerMap.updateSize();
          viewerMap.renderSync();
        }, 500);

        return false;
      };

      $scope.$on('$locationChangeSuccess', function(next, current) {
        $scope.activeTab = $location.path().
            match(/^(\/[a-zA-Z0-9]*)($|\/.*)/)[1];

        if (gnSearchLocation.isSearch() && (!angular.isArray(
            searchMap.getSize()) || searchMap.getSize()[0] < 0)) {

          setTimeout(function() {
            searchMap.updateSize();
            searchMap.renderSync(1000);

            // TODO: load custom context to the search map
            //gnOwsContextService.loadContextFromUrl(
            //  gnViewerSettings.defaultContext,
            //  searchMap);

          }, 0);
        }
        if (gnSearchLocation.isMap() && (!angular.isArray(
            viewerMap.getSize()) || viewerMap.getSize().indexOf(0) >= 0)) {
          setTimeout(function() {
            viewerMap.updateSize();
          }, 0);
        }
      });

      angular.extend($scope.searchObj, {
        advancedMode: false,
        from: 1,
        to: 30,
        viewerMap: viewerMap,
        searchMap: searchMap,
        mapfieldOption: {
          relations: ['within']
        },
        defaultParams: {
          'facet.q': '',
          resultType: gnSearchSettings.facetsSummaryType || 'details'
        },
        params: {
          'facet.q': '',
          resultType: gnSearchSettings.facetsSummaryType || 'details'
        }
      }, gnSearchSettings.sortbyDefault);


      // Refreshes the map in the initial load, otherwise no map displayed
      // until the window is resize or the user clicks the map.
      // Tried other options, but not working.
      setTimeout(function() {
        searchMap.updateSize();
        searchMap.renderSync();

      }, 2000);
    }]);

  module.controller('SweLogoutController',
	  ['$scope', '$http',
	  function($scope, $http) {
		  
		  $scope.logout = function() {
			  $http({method: 'GET',
	              url: '/AGLogout'
	              
	              /*headers: {
	                'X-Ajax-call': true}*/})
	            .success(function(data) {
	             // Redirect to home page
	             window.location.href = 'catalog.search';
	           })
	            .error(function(data) {
	             // Show error message
	             alert('Error');
	           });
		  };
	  }]);
  
  /**
   * Controller for mail feedback popup.
   *
   */
  module.controller('SweMailController', [
    '$cookies', '$scope', '$http',
    function($cookies, $scope, $http) {
      $scope.feedbackResult = null;
      $scope.feedbackResultError = false;

      $scope.sendMail = function() {
        if ($scope.feedbackForm.$invalid) return;

        $http.post('../api/0.1/site/feedback', null, {params: $scope.user})
            .then(function successCallback(response) {
              $scope.feedbackResult = response.data;
              $scope.feedbackResultError = false;

            }, function errorCallback(response) {
              $scope.feedbackResult = response.data;
              $scope.feedbackResultError = true;

            });
      };

      $scope.close = function() {
        // Cleanup and close the dialog
        $scope.user = {};
        $scope.feedbackResult = null;
        $scope.feedbackResultError = false;

        $scope.feedbackForm.$setPristine();
        $scope.feedbackForm.$setValidity();

        angular.element('#mail-popup').removeClass('show');
        $scope.$emit('body:class:remove', 'show-overlay');
      };
    }]);


  /**
   * Controller for new metadata popup.
   *
   */
  module.controller('SweNewMetadataController', [
    '$cookies', '$scope', '$rootScope', '$http', '$window', 'gnSearchManagerService', 'gnMetadataManager',
    function($cookies, $scope, $rootScope, $http, $window, gnSearchManagerService, gnMetadataManager) {
      var dataTypesToExclude = ['staticMap', 'theme', 'place'];
      var defaultType = 'dataset';
      var unknownType = 'unknownType';
      var fullPrivileges = true;

      var init = function() {

        // Metadata creation could be on a template
        // or by duplicating an existing record
        var query = 'template=y';

          // TODO: Better handling of lots of templates
          gnSearchManagerService.search('qi@json?template=y' +
            '&fast=index&from=1&to=200&_schema=iso19139.swe').
          then(function(data) {

            $scope.mdList = data;
            $scope.hasTemplates = data.count != '0';

            var types = [];
            // TODO: A faster option, could be to rely on facet type
            // But it may not be available
            for (var i = 0; i < data.metadata.length; i++) {
              var type = data.metadata[i].type || unknownType;
              if (type instanceof Array) {
                for (var j = 0; j < type.length; j++) {
                  if ($.inArray(type[j], dataTypesToExclude) === -1 &&
                    $.inArray(type[j], types) === -1) {
                    types.push(type[j]);
                  }
                }
              } else if ($.inArray(type, dataTypesToExclude) === -1 &&
                $.inArray(type, types) === -1) {
                types.push(type);
              }
            }
            types.sort();
            $scope.mdTypes = types;

            // Select the default one or the first one
            if (defaultType &&
              $.inArray(defaultType, $scope.mdTypes) > -1) {
              $scope.getTemplateNamesByType(defaultType);
            } else if ($scope.mdTypes[0]) {
              $scope.getTemplateNamesByType($scope.mdTypes[0]);
            } else {
              // No templates available ?
            }
          });

      };

      /**
       * Get all the templates for a given type.
       * Will put this list into $scope.tpls variable.
       */
      $scope.getTemplateNamesByType = function(type) {
        var tpls = [];
        $scope.titleFilter = '';
        for (var i = 0; i < $scope.mdList.metadata.length; i++) {
          var mdType = $scope.mdList.metadata[i].type || unknownType;
          if (mdType instanceof Array) {
            tpls.push($scope.mdList.metadata[i]);

            //if (mdType.indexOf(type) >= 0) {
            //  tpls.push($scope.mdList.metadata[i]);
            //}
          } else if (mdType == type) {
            tpls.push($scope.mdList.metadata[i]);
          } else {
            tpls.push($scope.mdList.metadata[i]);
          }
        }

        // Sort template list
        function compare(a, b) {
          if (a.title < b.title)
            return -1;
          if (a.title > b.title)
            return 1;
          return 0;
        }
        tpls.sort(compare);

        $scope.tpls = tpls;
        $scope.activeType = type;
        $scope.setActiveTpl($scope.tpls[0]);
        return false;
      };

      $scope.setActiveTpl = function(tpl) {
        $scope.activeTpl = tpl;
      };

      $scope.createNewMetadata = function(isPublic) {
        var metadataUuid = '';

        var editorAppUrl = $window.location.origin +
            $window.location.pathname.replace('catalog.search', 'catalog.edit') + '#';

        return gnMetadataManager.create(
          $scope.activeTpl['geonet:info'].id,
          $scope.ownerGroup,
          isPublic || false,
          false,
          false,
          undefined,
          metadataUuid,
          editorAppUrl
        ).error(function(data) {
          $rootScope.$broadcast('StatusUpdated', {
            title: $translate('createMetadataError'),
            error: data.error,
            timeout: 0,
            type: 'danger'});
        });
      };

      $scope.close = function() {
        // Cleanup and close the dialog

        angular.element('#newmetadata-popup').removeClass('show');
        $scope.$emit('body:class:remove', 'show-overlay');
      };

      init();
    }]);


  /**
   * Controller for the filter panel.
   *
   */
  module.controller('SweFilterPanelController', ['$scope', '$localStorage',
    function($scope, $localStorage) {

      $scope.advancedMode = false;

      // keys for topic categories translations
      $scope.topicCategories = ['farming', 'biota', 'boundaries',
        'climatologyMeteorologyAtmosphere', 'economy',
        'elevation', 'environment', 'geoscientificInformation', 'health',
        'imageryBaseMapsEarthCover', 'intelligenceMilitary', 'inlandWaters',
        'location', 'oceans', 'planningCadastre', 'society', 'structure',
        'transportation', 'utilitiesCommunication'];

      // Selected topic categories
      $scope.selectedTopicCategories = [];


      /**
       * Toggles a topic category selection.
       *
       * @param {string} topic
         */
      $scope.toggleTopicCategory = function(topic) {
        var pos = $scope.selectedTopicCategories.indexOf(topic);

        if (pos > -1) {
          $scope.selectedTopicCategories.splice(pos, 1);
        } else {
          $scope.selectedTopicCategories.push(topic);
        }

        $scope.searchObj.params.topicCat =
            $scope.selectedTopicCategories.join(' or ');
        $scope.triggerSearch();
      };


      /**
       * Unselects a topic category.
       *
       * @param {string} topic
         */
      $scope.unselectTopicCategory = function(topic) {
        var pos = $scope.selectedTopicCategories.indexOf(topic);

        if (pos > -1) {
          $scope.selectedTopicCategories.splice(pos, 1);
        }

        $scope.searchObj.params.topicCat =
            $scope.selectedTopicCategories.join(' or ');
        $scope.triggerSearch();
      };


      /**
       * Checks if a topic category is selected.
       *
       * @param {string} topic
       * @return {boolean}
         */
      $scope.isTopicCategorySelected = function(topic) {
        return ($scope.selectedTopicCategories.indexOf(topic) > -1);
      };


      /**
       * Toggles the map resources filter.
       *
       */
      $scope.toggleMapResources = function() {
        $scope.searchObj.params.dynamic =
            ($scope.searchObj.params.dynamic == 'true' ? '' : 'true');
        $scope.triggerSearch();
      };


      /**
       * Unselects the map resources filter.
       */
      $scope.unselectMapResources = function() {
        delete $scope.searchObj.params.dynamic;
        $scope.triggerSearch();
      };


      /**
       * Toggles the download resources filter.
       */
      $scope.toggleDownloadResources = function() {
        $scope.searchObj.params.download =
            ($scope.searchObj.params.download == 'true' ? '' : 'true');
        $scope.triggerSearch();
      };


      /**
       * Unselects the download resources filter.
       */
      $scope.unselectDownloadResources = function() {
        delete $scope.searchObj.params.download;
        $scope.triggerSearch();
      };


      /**
       * Unselects the resource date from.
       */
      $scope.unselectResourceDateFrom = function() {
        delete $scope.searchObj.params.resourceDateFrom;
        $scope.triggerSearch();
      };


      /**
       * Unselects the resource date to.
       */
      $scope.unselectResourceDateTo = function() {
        delete $scope.searchObj.params.resourceDateTo;
        $scope.triggerSearch();
      };


      /**
       * Toggles a the favorites selection.
       *
       * @param {string} topic
       */
      $scope.toggleFavorites = function() {
        // Use an invalid value -- to manage the case no favorites are selected,
        // to don't display any metadata
        if ($localStorage.favoriteMetadata != undefined) {
          $scope.searchObj.params._id =
              ($scope.searchObj.params._id ? '' :
              ($localStorage.favoriteMetadata.length > 0) ?
              $localStorage.favoriteMetadata.join(' or ') : '--');
        } else {
          $scope.searchObj.params._id =
              ($scope.searchObj.params._id ? '' : '--');
        }

        $scope.triggerSearch();
      };


      /**
       * Unselects the favorites filter.
       */
      $scope.unselectFavoriteResources = function() {
        delete $scope.searchObj.params._id;
        $scope.triggerSearch();
      };


      /**
       * Clean search options to view all metadata.
       */
      $scope.viewAllMetadata = function() {
        $scope.selectedTopicCategories = [];
        delete $scope.searchObj.params.topicCat;
        delete $scope.searchObj.params.download;
        delete $scope.searchObj.params.dynamic;
        delete $scope.searchObj.params.any;

        $scope.triggerSearch();
      };


      /**
       * Toggles the filter panel.
       */
      $scope.toggleFilterPanel = function() {
        var element = angular.element('.site-filter-cont');

        if (element.hasClass('open')) {
          element.removeClass('open');
        } else {
          element.addClass('open');
        }
      };

      /**
       * Toggles the advance options panel.
       */
      $scope.toggleAdvancedOptions = function() {
        if ($scope.advancedMode) {
          angular.element('.filter-options-cont').removeClass('open');
          angular.element('.site-filter-cont').removeClass('advanced');
        } else {
          angular.element('.filter-options-cont').addClass('open');
          angular.element('.site-filter-cont').addClass('advanced');
        }

        $scope.advancedMode = !$scope.advancedMode;
      };

      /**
       * Closes the filter panel.
       */
      $scope.closeFilterPanel = function() {
        angular.element('.site-filter-cont').removeClass('open');

        $scope.open = false;
      };
    }]);

  /**
  * Controller for the image filter panel.
  *
  */
  module.controller('SweFilterController', ['$scope', function($scope) {
    $scope.hovering = false;
    // replace prefined queries with a service returning the possible queries
    $scope.predefinedQueries = [{
      image: 'http://lorempixel.com/210/125/nature/?id=1',
      tooltip: 'Filter 1',
      text: 'Filter 1',
      query: 'Filter Query 1',
      url: 'http://localhost:8080/geonetwork/catalog/views/' +
          'swe/resources/owscontext.xml'
    }, {
      image: 'http://lorempixel.com/210/125/nature/?id=2',
      tooltip: 'Filter 2',
      text: 'Filter 2',
      query: 'Filter Query 2',
      url: 'http://localhost:8080/geonetwork/catalog/views/' +
          'swe/resources/owscontext.xml'
    }, {
      image: 'http://lorempixel.com/210/125/nature/?id=3',
      tooltip: 'Filter 3',
      text: 'Filter 3',
      query: 'Filter Query 3',
      url: 'http://localhost:8080/geonetwork/catalog/views/' +
          'swe/resources/owscontext.xml'
    }, {
      image: 'http://lorempixel.com/210/125/nature/?id=4',
      tooltip: 'Filter 4',
      text: 'Filter 4',
      query: 'Filter Query 4',
      url: 'http://localhost:8080/geonetwork/catalog/views/' +
          'swe/resources/owscontext.xml'
    }];

    $scope.doFilter = function(query) {
      var map = {};
      map.url = query.url;
      $scope.resultviewFns.loadMap(map);
    };
  }]);

  /**
   * Controller for geo suggestions.
   *
   */
  module.controller('SweGeoSuggestionsController', ['$scope', '$http',
    function($scope, $http) {
    $scope.getNameSearch = function(val) {
      var posturl = 'https://www.geodata.se/NameWebService/search';

      var params = {
        'searchstring': val,
        'callback': 'JSON_CALLBACK'
      };
      return $http({
        method: 'JSONP',
        url: posturl,
        params: params
      }).then(function(res) {
        var data = res.data;
        var status = res.status;
        var headers = res.headers;
        var config = res.config;
        var statusText = res.statusText;


        return data;
      });
    };
  }]);

  /**
   * orderByTranslated Filter
   * Sort ng-options or ng-repeat by translated values
   * @example
   *   ng-repeat="scheme in data.schemes |
   *    orderByTranslated:'storage__':'collectionName'"
   * @param  {Array|Object} array or hash
   * @param  {String} i18nKeyPrefix
   * @param  {String} objKey (needed if hash)
   * @return {Array}
   */
  module.filter('orderByTranslated', ['$translate', '$filter',
    function($translate, $filter) {
      return function(array, i18nKeyPrefix, objKey) {
        var result = [];
        var translated = [];
        angular.forEach(array, function(value) {
          var i18nKeySuffix = objKey ? value[objKey] : value;
          translated.push({
            key: value,
            label: $translate.instant(i18nKeyPrefix + i18nKeySuffix)
          });
        });
        angular.forEach($filter('orderBy')(translated, 'label'),
            function(sortedObject) {
              result.push(sortedObject.key);
            }
        );
        return result;
      };
    }]);

})();
