// Copyright (c) Rotorz Limited. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root

"use strict";


const given = require("mocha-testdata");
const should = require("should");

const Environment = require("webreed-core/lib/Environment").Environment;
const PluginContext = require("webreed-core/lib/PluginContext").PluginContext;
const ResourceType = require("webreed-core/lib/ResourceType").ResourceType;

const TemplateTransformer = require("../../lib/TemplateTransformer").TemplateTransformer;

const FakeTemplateEngine = require("../fakes/FakeTemplateEngine").FakeTemplateEngine;


describe("TemplateTransformer", function () {

  beforeEach(function () {
    this.env = new Environment();
    this.env.templateEngines.set("fake", new FakeTemplateEngine());
    this.templateTransformer = new TemplateTransformer(this.env);

    let fakeTemplateResourceType = new ResourceType();
    fakeTemplateResourceType.templateEngine = new PluginContext("fake");
    this.transformerContext = {
      resourceType: fakeTemplateResourceType
    };
  });


  it("is named 'TemplateTransformer'", function () {
    TemplateTransformer.name
      .should.be.eql("TemplateTransformer");
  });


  describe("#constructor()", function () {

    it("is a function", function () {
      TemplateTransformer.prototype.constructor
        .should.be.a.Function();
    });

  });


  describe("#transform(resource, context)", function () {

    it("is a function", function () {
      this.templateTransformer.transform
        .should.be.a.Function();
    });

    it("rejects with error from template engine", function () {
      let sourceResource = this.env.createResource({
        body: "Empty",
        throwError: "test error"
      });

      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toPromise()
        .should.be.rejectedWith({ message: "test error" });
    });

    it("outputs the source resource when source resource doesn't have a 'body' property", function () {
      let sourceResource = this.env.createResource();
      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toPromise()
        .should.eventually.be.exactly(sourceResource);
    });

    it("sets 'body' property from rendered template", function () {
      let sourceResource = this.env.createResource({
        body: "Hello, {name}. {message}",
        name: "Bob",
        message: "How are you?"
      });

      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toPromise()
        .should.eventually.have.properties({
          body: "Hello, Bob. How are you?"
        });
    });

    it("yields multiple resources when template is paginated", function () {
      let sourceResource = this.env.createResource({
        pageCount: 2,
        body: "Hello, {name}. Page {page}",
        name: "Bob"
      });

      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toArray().toPromise().then(outputs => {
          outputs[0].body
            .should.be.eql("Hello, Bob. Page 1");
          outputs[1].body
            .should.be.eql("Hello, Bob. Page 2");
        });
    });

    it("provides resource url to template engine", function () {
      let fakeTemplateEngine = this.env.templateEngines.get("fake");

      let sourceResource = this.env.createResource({
        _baseUrl: "http://example.com",
        _path: "test",
        _extension: ".html",
        body: "Hello, {name}. Page {page}"
      });

      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toPromise()
        .then(() => {
          fakeTemplateEngine.lastRenderTemplateStringArguments[2].url
            .should.be.eql("http://example.com/test.html");
        });
    });

    it("provides pagination provider to template engine when resource can be paginated", function () {
      let fakeTemplateEngine = this.env.templateEngines.get("fake");

      let sourceResource = this.env.createResource({
        _path: "test",
        body: "Hello, {name}. Page {page}"
      });

      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toPromise()
        .then(() => {
          fakeTemplateEngine.lastRenderTemplateStringArguments[2].paginationProvider.paginate
            .should.be.a.Function();
        });
    });

    it("does not provide pagination provider to template engine when resource cannot be paginated", function () {
      let fakeTemplateEngine = this.env.templateEngines.get("fake");

      let sourceResource = this.env.createResource({
        body: "Hello, {name}. Page {page}"
      });

      return this.templateTransformer.transform(sourceResource, this.transformerContext)
        .toPromise()
        .then(() => {
          should( fakeTemplateEngine.lastRenderTemplateStringArguments[2].paginationProvider )
            .be.undefined();
        });
    });

  });

});
