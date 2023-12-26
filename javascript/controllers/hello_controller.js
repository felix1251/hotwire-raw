import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  connect() {}

  greet() {
    console.log("greetings");
  }
}
