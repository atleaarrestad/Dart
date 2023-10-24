import { type Route, Router } from "@vaadin/router";
import { css, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

declare global {
  interface HTMLElementTagNameMap {
    "dart-router": DartRouterElement;
  }
}

@customElement("dart-router")
export class DartRouterElement extends LitElement {
  public routes: Route[] = [
    {
      path: "",
      component: "dart-layout",
      action: () => void import("../layout/layout-element.js"),
      children: [
        {
          path: "/",
          redirect: "/play",
        },
        {
          path: "",
          redirect: "/play",
        },
        {
          path: "/play",
          component: "dart-play-page",
          action: () => void import("../pages/play/play-page.js"),
        },
        {
          path: "/leaderboard",
          component: "dart-leaderboard-page",
          action: () =>
            void import("../pages/leaderboards/leaderboard-page.js"),
        },
        {
          path: "/game-log",
          component: "dart-game-log-page",
          action: () => void import("../pages/game-log/game-log-page.js"),
        },
      ],
    },
  ];

  public router = new Router();

  public override connectedCallback(): void {
    super.connectedCallback();

    this.router.baseUrl = "/Dart/";
    this.router.setRoutes(this.routes);
    this.router.setOutlet(this.renderRoot);

    if (
      location.pathname === this.router.baseUrl.replace(/\/$/, "") &&
      !location.pathname.endsWith("/")
    )
      Router.go(this.router.baseUrl);
  }

  public static override styles = [
    css`
      :host {
        display: grid;
        overflow: hidden;
      }
    `,
  ];
}
