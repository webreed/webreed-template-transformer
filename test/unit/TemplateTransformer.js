// Copyright (c) Rotorz Limited. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root.


import given from "mocha-testdata";
import should from "should";

import {Environment} from "webreed-core/lib/Environment";
import {PluginContext} from "webreed-core/lib/PluginContext";
import {ResourceType} from "webreed-core/lib/ResourceType";

import {TemplateTransformer} from "../../lib/TemplateTransformer";

import {FakeTemplateEngine} from "../fakes/FakeTemplateEngine";


describe("TemplateTransformer", function () {

  beforeEach(function () {
    this.env = new Environment();
    this.env.templateEngines.set("fake", new FakeTemplateEngine());
    this.templateTransformer = new TemplateTransformer(this.env);

    let fakeTemplateResourceType = new ResourceType();
    fakeTemplateResourceType.templateEngine = new PluginContext("fake");
    this.templateEngineContext = {
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

      return this.templateTransformer.transform(sourceResource, this.templateEngineContext)
        .toPromise()
        .should.be.rejectedWith({ message: "test error" });
    });

    it("outputs the source resource when source resource doesn't have a 'body' property", function () {
      let sourceResource = this.env.createResource();
      return this.templateTransformer.transform(sourceResource, this.templateEngineContext)
        .toPromise()
        .should.eventually.be.exactly(sourceResource);
    });

    it("sets 'body' property from rendered template", function () {
      let sourceResource = this.env.createResource({
        body: "Hello, {name}. {message}",
        name: "Bob",
        message: "How are you?"
      });

      return this.templateTransformer.transform(sourceResource, this.templateEngineContext)
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

      return this.templateTransformer.transform(sourceResource, this.templateEngineContext)
        .toArray().toPromise().then(outputs => {
          outputs[0].body
            .should.be.eql("Hello, Bob. Page 1");
          outputs[1].body
            .should.be.eql("Hello, Bob. Page 2");
        });
    });

  });

});
