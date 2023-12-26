// FIXME: es-module-shim won't shim the dynamic import without this explicit import
import "@hotwired/stimulus";

const controllerAttribute = "data-controller";

// Lazy load controllers registered beneath the `under` path in the import map to the passed application instance.
export function lazyLoadControllersFrom(
  under,
  application,
  element = document
) {
  lazyLoadExistingControllers(under, application, element);
  lazyLoadNewControllers(under, application, element);
}

function lazyLoadExistingControllers(under, application, element) {
  queryControllerNamesWithin(element).forEach((controllerName) =>
    loadController(controllerName, under, application)
  );
}

function lazyLoadNewControllers(under, application, element) {
  new MutationObserver((mutationsList) => {
    for (const { attributeName, target, type } of mutationsList) {
      switch (type) {
        case "attributes": {
          if (
            attributeName == controllerAttribute &&
            target.getAttribute(controllerAttribute)
          ) {
            extractControllerNamesFrom(target).forEach((controllerName) =>
              loadController(controllerName, under, application)
            );
          }
        }

        case "childList": {
          lazyLoadExistingControllers(under, application, target);
        }
      }
    }
  }).observe(element, {
    attributeFilter: [controllerAttribute],
    subtree: true,
    childList: true,
  });
}

function queryControllerNamesWithin(element) {
  return Array.from(element.querySelectorAll(`[${controllerAttribute}]`))
    .map(extractControllerNamesFrom)
    .flat();
}

function extractControllerNamesFrom(element) {
  return element
    .getAttribute(controllerAttribute)
    .split(/\s+/)
    .filter((content) => content.length);
}

function loadController(name, under, application) {
  if (canRegisterController(name, application)) {
    import(controllerFilename(name, under))
      .then((module) => registerController(name, module, application))
      .catch((error) =>
        console.error(`Failed to autoload controller: ${name}`, error)
      );
  }
}

function controllerFilename(name, under) {
  return `${under}/${name.replace(/--/g, "/").replace(/-/g, "_")}_controller`;
}

function registerController(name, module, application) {
  if (canRegisterController(name, application)) {
    application.register(name, module.default);
  }
}

function canRegisterController(name, application) {
  return !application.router.modulesByIdentifier.has(name);
}
