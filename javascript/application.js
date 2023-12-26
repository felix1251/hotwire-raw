import { Application } from "@hotwired/stimulus";
import { lazyLoadControllersFrom } from "@hotwired/stimulus-loading";
import "@hotwired/turbo";

window.Stimulus = Application.start();

lazyLoadControllersFrom("controllers", Stimulus);
