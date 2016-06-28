<?xml version="1.0" encoding="UTF-8"?>
<!--
  ~ Copyright (C) 2001-2016 Food and Agriculture Organization of the
  ~ United Nations (FAO-UN), United Nations World Food Programme (WFP)
  ~ and United Nations Environment Programme (UNEP)
  ~
  ~ This program is free software; you can redistribute it and/or modify
  ~ it under the terms of the GNU General Public License as published by
  ~ the Free Software Foundation; either version 2 of the License, or (at
  ~ your option) any later version.
  ~
  ~ This program is distributed in the hope that it will be useful, but
  ~ WITHOUT ANY WARRANTY; without even the implied warranty of
  ~ MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  ~ General Public License for more details.
  ~
  ~ You should have received a copy of the GNU General Public License
  ~ along with this program; if not, write to the Free Software
  ~ Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA
  ~
  ~ Contact: Jeroen Ticheler - FAO - Viale delle Terme di Caracalla 2,
  ~ Rome - Italy. email: geonetwork@osgeo.org
  -->


<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gts="http://www.isotc211.org/2005/gts"
                xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmx="http://www.isotc211.org/2005/gmx"
                xmlns:srv="http://www.isotc211.org/2005/srv" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink"
                xmlns:gn="http://www.fao.org/geonetwork"
                xmlns:gn-fn-core="http://geonetwork-opensource.org/xsl/functions/core"
                xmlns:gn-fn-metadata="http://geonetwork-opensource.org/xsl/functions/metadata"
                xmlns:gn-fn-iso19139="http://geonetwork-opensource.org/xsl/functions/profiles/iso19139"
                xmlns:exslt="http://exslt.org/common" exclude-result-prefixes="#all">

  <xsl:include href="utility-tpl.xsl"/>

  <!-- Visit all XML tree recursively -->
  <xsl:template mode="mode-iso19139.swe" match="*|@*">
    <xsl:param name="schema" select="$schema" required="no"/>
    <xsl:param name="labels" select="$labels" required="no"/>

    <xsl:apply-templates mode="mode-iso19139" select=".">
      <xsl:with-param name="schema" select="$schema"/>
      <xsl:with-param name="labels" select="$labels"/>
    </xsl:apply-templates>
  </xsl:template>

  <xsl:template mode="mode-iso19139" match="gmd:MD_Metadata/gmd:referenceSystemInfo[1]/gmd:MD_ReferenceSystem/gmd:referenceSystemIdentifier" priority="1000">
    <xsl:param name="schema" select="$schema" required="no"/>
    <xsl:param name="labels" select="$labels" required="no"/>

    <xsl:variable name="labelConfig"
                  select="gn-fn-metadata:getLabel($schema, name(), $labels, name(..), '', '')"/>


    <xsl:variable name="refSystemXmlSnippet">
      <![CDATA[
         <gmd:referenceSystemInfo xmlns:gmd="http://www.isotc211.org/2005/gmd"
              xmlns:gco="http://www.isotc211.org/2005/gco">
            <gmd:MD_ReferenceSystem>
               <gmd:referenceSystemIdentifier>
                  <gmd:RS_Identifier>
                     <gmd:code>
                        <gco:CharacterString>{{editRow.code}}</gco:CharacterString>
                     </gmd:code>
                     <gmd:codeSpace>
                        <gco:CharacterString>{{editRow.codespace}}</gco:CharacterString>
                     </gmd:codeSpace>

                  </gmd:RS_Identifier>
               </gmd:referenceSystemIdentifier>
            </gmd:MD_ReferenceSystem>
        </gmd:referenceSystemInfo>
    ]]>
    </xsl:variable>

    <xsl:variable name="refSystemModel">
      [
      <xsl:for-each select="../../../gmd:referenceSystemInfo/gmd:MD_ReferenceSystem/gmd:referenceSystemIdentifier">
        {
        'ref': '<xsl:value-of select="../../../gn:element/@ref" />',
        'refcode': '<xsl:value-of select="gmd:RS_Identifier/gmd:code/gco:CharacterString/gn:element/@ref" />',
        'refcodespace': '<xsl:value-of select="gmd:RS_Identifier/gmd:codeSpace/gco:CharacterString/gn:element/@ref" />',
        'code': '<xsl:value-of select="normalize-space(gmd:RS_Identifier/gmd:code/gco:CharacterString )" />',
        'codespace': '<xsl:value-of select="normalize-space(gmd:RS_Identifier/gmd:codeSpace/gco:CharacterString)" />'
        }
        <xsl:if test="position() != last()">,</xsl:if>
      </xsl:for-each>
      ]
    </xsl:variable>

    <div class="form-group gn-field" data-ng-controller="SweEditorTableController"
         data-ng-init="init({$refSystemModel}, '{$refSystemXmlSnippet}', {../../../gn:element/@ref}, '#refsystem-popup')" >
      <label class="col-sm-2 control-label">
        <xsl:value-of select="$labelConfig/label"/>
      </label>

      <div class="geo-data-toolbar-cont col-sm-10">
        <div class="toolbar-right-list tool-bar-list">
          <div class="link-cont ng-scope">
            <a class="-label-link" href="" data-ng-click="addRow()" ><span class="icon-pencil"></span>Lägg till</a>
          </div>
          <div class="link-cont ng-scope">
            <a class="-label-link" href="" data-ng-class="{{'not-active':selectedRowIndex == null}}" data-ng-click="removeRow()" ><span class="icon-pencil"></span>Ta bort</a>
          </div>
          <div class="link-cont ng-scope">
            <a class="-label-link" href="" data-ng-class="{{'not-active':selectedRowIndex == null}}" data-ng-click="editRow()" ><span class="icon-pencil"></span>Redigera</a>
          </div>
        </div>
      </div>

      <input type="hidden" data-ng-repeat="row in rows | filter: isExistingItem" data-ng-value="row.code" name="_{{{{row.refcode}}}}" />
      <input type="hidden" data-ng-repeat="row in rows | filter: isExistingItem" data-ng-value="row.codespace" name="_{{{{row.refcodespace}}}}" />

      <input type="hidden" data-ng-repeat="row in rows | filter: isNewItem" data-ng-value="row.xmlSnippet" name="_X{{{{parent}}}}_gmdCOLONreferenceSystemInfo" />

      <div class="fixed-table-container">
        <table class="table table-hover table-bordered" style="background-color: #ffffff">
          <thead>
            <tr>
              <th><div class="th-inner "><xsl:value-of select="gn-fn-metadata:getLabel($schema, name(gmd:RS_Identifier/gmd:code), $labels, name(gmd:RS_Identifier), '', '')/label" /></div></th>
              <th><div class="th-inner "><xsl:value-of select="gn-fn-metadata:getLabel($schema, name(gmd:RS_Identifier/gmd:codeSpace), $labels, name(gmd:RS_Identifier), '', '')/label" /></div></th>
            </tr>
          </thead>
          <tbody>
            <tr data-ng-repeat="row in rows" data-ng-class="{{'selected':$index == selectedRowIndex}}" data-ng-click="setClickedRow($index)">
              <td>{{row.code}}</td>
              <td>{{row.codespace}}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Dialog to edit the ref. system -->
      <div data-gn-modal=""
           data-gn-popup-options="{{title:'{$labelConfig/label}'}}"
           id="refsystem-popup" class="gn-modal-lg">

        <div data-swe-date-dialog="">
          <div>
            <label class="col-sm-2 control-label">
              Code
            </label>
            <input type="text" class="form-control" data-ng-model="editRow.code" />
          </div>

          <div>
            <label class="col-sm-2 control-label">
              Codespace
            </label>

            <input type="text" class="form-control" data-ng-model="editRow.codespace" />
          </div>

          <div class="">
            <button type="button" class="btn navbar-btn btn-success" data-ng-click="saveRow()">
              Save
            </button>&#160;
            <button type="button" class="btn navbar-btn btn-default" data-ng-click="cancel()">
              Cancel
            </button>

          </div>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template mode="mode-iso19139" match="gmd:MD_Metadata/gmd:referenceSystemInfo[position() &gt; 1]/gmd:MD_ReferenceSystem/gmd:referenceSystemIdentifier" priority="1000" />

  <xsl:template mode="mode-iso19139" match="gmd:MD_Metadata/gmd:identificationInfo/*/gmd:citation/gmd:CI_Citation/gmd:date[1]" priority="3000">
    <xsl:param name="schema" select="$schema" required="no"/>
    <xsl:param name="labels" select="$labels" required="no"/>

    <xsl:variable name="labelConfig"
                  select="gn-fn-metadata:getLabel($schema, name(), $labels, name(..), '', '')"/>


    <xsl:variable name="dateXmlSnippet">
      <![CDATA[
      <gmd:date xmlns:gmd="http://www.isotc211.org/2005/gmd">
      <gmd:CI_Date>
      <gmd:date>
        <gco:Date xmlns:gco="http://www.isotc211.org/2005/gco">{{editRow.date}}</gco:Date>
      </gmd:date>
      <gmd:dateType>
      <gmd:CI_DateTypeCode codeListValue="{{editRow.datetype}}"
                            codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/codelist/ML_gmxCodelists.xml#CI_DateTypeCode"/>
        </gmd:dateType>
      </gmd:CI_Date>
    </gmd:date>
    ]]>
    </xsl:variable>

    <xsl:variable name="dateModel">
      [
      <xsl:for-each select="../gmd:date">
        {
        'ref': '<xsl:value-of select="gn:element/@ref" />',
        'refdate': '<xsl:value-of select="gmd:CI_Date/gmd:date/*/gn:element/@ref" />',
        'refdatetype': '<xsl:value-of select="gmd:CI_Date/gmd:dateType/gmd:CI_DateTypeCode/gn:element/@ref" />',
        'date': '<xsl:value-of select="normalize-space(gmd:CI_Date/gmd:date/gco:DateTime|gmd:CI_Date/gmd:date/gco:Date)" />',
        'datetype': '<xsl:value-of select="normalize-space(gmd:CI_Date/gmd:dateType/gmd:CI_DateTypeCode/@codeListValue)" />'
        }
        <xsl:if test="position() != last()">,</xsl:if>
      </xsl:for-each>
      ]
    </xsl:variable>


    <div class="form-group gn-field" data-ng-controller="SweEditorTableController"
         data-ng-init="init({$dateModel}, '{$dateXmlSnippet}', {../gn:element/@ref}, '#date-popup')" >
      <label class="col-sm-2 control-label">
        <xsl:value-of select="$labelConfig/label"/>
      </label>

      <div class="geo-data-toolbar-cont col-sm-10">
        <div class="toolbar-right-list tool-bar-list">
          <div class="link-cont ng-scope">
            <a class="-label-link" href="" data-ng-click="addRow()" ><span class="icon-pencil"></span>Lägg till</a>
          </div>
          <div class="link-cont ng-scope">
            <a class="-label-link" href="" data-ng-class="{{'not-active':selectedRowIndex == null}}" data-ng-click="removeRow()" ><span class="icon-pencil"></span>Ta bort</a>
          </div>
          <div class="link-cont ng-scope">
            <a class="-label-link" href="" data-ng-class="{{'not-active':selectedRowIndex == null}}" data-ng-click="editRow()" ><span class="icon-pencil"></span>Redigera</a>
          </div>
        </div>
      </div>

      <input type="hidden" data-ng-repeat="row in rows | filter: isExistingItem" data-ng-value="row.date" name="_{{{{row.refdate}}}}" />
      <input type="hidden" data-ng-repeat="row in rows | filter: isExistingItem" data-ng-value="row.datetype" name="_{{{{row.refdatetype}}}}_codeListValue" />

      <input type="hidden" data-ng-repeat="row in rows | filter: isNewItem" data-ng-value="row.xmlSnippet" name="_X{{{{parent}}}}_gmdCOLONdate" />

      <div class="fixed-table-container">
        <table class="table table-hover table-bordered" style="background-color: #ffffff">
          <thead>
            <tr>
              <th><div class="th-inner "><xsl:value-of select="gn-fn-metadata:getLabel($schema, name(gmd:CI_Date/gmd:date), $labels, name(..), '', '')/label" /></div></th>
              <th><div class="th-inner "><xsl:value-of select="gn-fn-metadata:getLabel($schema, name(gmd:CI_Date/gmd:dateType), $labels, name(..), '', '')/label" /></div></th>
            </tr>
          </thead>
          <tbody>
              <tr data-ng-repeat="row in rows" data-ng-class="{{'selected':$index == selectedRowIndex}}" data-ng-click="setClickedRow($index)">
                <td>{{row.date}}</td>
                <td>{{row.datetype}}</td>
              </tr>
          </tbody>
        </table>
      </div>

      <!-- Dialog to edit the dates -->
      <div data-gn-modal=""
         data-gn-popup-options="{{title:'{$labelConfig/label}'}}"
         id="date-popup" class="gn-modal-lg">

      <div data-swe-date-dialog="">
        <div>
          <label class="col-sm-2 control-label">
            Date
          </label>
          <!--<input name="date" type="text" class="form-control" data-ng-model="selectedRow.date" />-->
          <div data-gn-date-picker="{{editRow.date}}"
               data-label=""
               data-tag-name=""
               data-element-ref="datevalue">>
          </div>
        </div>

        <div>
          <label class="col-sm-2 control-label">
            Date type
          </label>

          <xsl:variable name="codelist"
                        select="gn-fn-metadata:getCodeListValues($schema,
                                  'gmd:CI_DateTypeCode',
                                  $codelists,
                                  .)"/>

          <select class="" data-ng-model="editRow.datetype">
            <xsl:for-each select="$codelist/entry">
              <xsl:sort select="label"/>
              <option value="{code}" title="{normalize-space(description)}">
                <xsl:value-of select="label"/>
              </option>
            </xsl:for-each>
          </select>
          <!--<input name="datetype" type="text" class="form-control" data-ng-model="selectedRow.datetype" />-->
        </div>

        <div class="">
          <button type="button" class="btn navbar-btn btn-success" data-ng-click="saveRow()">
            Save
          </button>&#160;
          <button type="button" class="btn navbar-btn btn-default" data-ng-click="cancel()">
            Cancel
          </button>

        </div>
      </div>

    </div>
    </div>

  </xsl:template>

  <xsl:template mode="mode-iso19139" match="gmd:MD_Metadata/gmd:identificationInfo/*/gmd:citation/gmd:CI_Citation/gmd:date[position() &gt; 1]" priority="3000" />

</xsl:stylesheet>
