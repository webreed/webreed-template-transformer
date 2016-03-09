// Copyright (c) Rotorz Limited. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root.


import { Observable } from "rxjs";

import {Environment} from "webreed-core/lib/Environment";
import {ResourceType} from "webreed-core/lib/ResourceType";
import {Resource} from "webreed-core/lib/Resource";
import {Transformer} from "webreed-core/lib/plugin/Transformer";


/**
 * Renders the template represented by the body of the source resource using the
 * associated template engine and replaces the body of the resulting resource with the
 * rendered output of the template engine.
 */
export class TemplateTransformer implements Transformer {

  private _env: Environment;

  /**
   * @param env
   *   An environment that represents a webreed project.
   */
  constructor(env: Environment) {
    this._env = env;
  }

  public transform(resource: Resource, context: Object): Observable<Resource> {
    if (!resource.body) {
      // There is no body of template content to transform!
      return Observable.of(resource);
    }

    let resourceType = <ResourceType>context["resourceType"];
    let templateEngine = resourceType.templateEngine;
    let templateEnginePlugin = this._env.templateEngines.lookup(templateEngine.name);

    let templateEngineContext = {
      templateEngine: {
        name: templateEngine.name,
        options: templateEngine.options
      }
    };

    return templateEnginePlugin.renderTemplateString(<string>resource.body, resource, templateEngineContext)
      .map(output => resource.clone({
        _page: output.page !== undefined && output.page !== null
          ? output.page.toString()
          : undefined,
        body: output.body,
      }));
  }

}
