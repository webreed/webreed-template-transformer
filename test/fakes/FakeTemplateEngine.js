// Copyright (c) Rotorz Limited. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root.


import {Observable} from "rxjs";

import {TemplateOutput} from "webreed-core/lib/plugin/TemplateEngine";


export class FakeTemplateEngine {

  clearTemplateCache() {
  }

  renderTemplateString(template, templateParams, context) {
    templateParams = templateParams || {};

    let pageCount = templateParams.pageCount !== undefined
      ? templateParams.pageCount
      : 1;

    templateParams = Object.assign({}, templateParams);

    // Force the fake template engine to throw an error with a specific message?
    if (typeof templateParams.throwError === "string") {
      return Observable.throw(new Error(templateParams.throwError));
    }

    return new Observable(observer => {
      for (let page = 1; page <= pageCount; ++page) {
        templateParams.page = page;

        let output = new TemplateOutput();
        output.page = !!templateParams.pageCount ? page.toString() : undefined;
        output.body = template.replace(/\{([^\}]+)\}/g, (match, paramKey) => templateParams[paramKey]);

        observer.next(output);
      }
      observer.complete();
    });
  }

  renderTemplate(templateName, templateParams, context) {
    throw new Error("Function 'renderTemplate(templateName, templateParams)' should not execute in unit tests.");
  }

}
