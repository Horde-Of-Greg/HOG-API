let endpointHandler: EndpointHandler | null = null;

export class EndpointHandler {
  source: string;
  main: string | null;
  child: string | null;

  constructor(sourceIn: string) {
    this.source = sourceIn;
    this.main = null;
    this.child = null;
  }

  getSource() {
    return this.source;
  }

  getMain() {
    return this.main;
  }

  getChild() {
    return this.child;
  }

  setMain(mainIn: string) {
    this.main = mainIn;
  }

  setChild(childIn: string) {
    this.child = childIn;
  }
}

export function initEndpointHandler(source: string): EndpointHandler {
  if (endpointHandler) return endpointHandler;
  endpointHandler = new EndpointHandler(source);
  return endpointHandler;
}

export function getEndpointHandler(): EndpointHandler {
  if (!endpointHandler)
    throw new Error(
      "Endpoint Handler not initialized. Call initEndpointHandler(source:string) first."
    );
  return endpointHandler;
}

export function nullifyEndpointHandler() {
  endpointHandler = null;
}
