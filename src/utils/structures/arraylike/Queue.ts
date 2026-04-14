export class Queue<TType> {
  private data: Array<TType> = [];

  enqueue(element: TType) {
    this.data.push(element);
  }

  dequeue() {
    return this.data.shift();
  }
}
