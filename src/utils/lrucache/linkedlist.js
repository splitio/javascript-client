/**
 * yallist implementation based on isaacs/yallist (https://github.com/isaacs/yallist/yallist.js),
 * with the minimal features used by the SDK.

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
**/

export class Node {
  constructor(value, prev, next, list) {
    this.list = list;
    this.value = value;
  
    if (prev) {
      prev.next = this;
      this.prev = prev;
    } else {
      this.prev = null;
    }
  
    if (next) {
      next.prev = this;
      this.next = next;
    } else {
      this.next = null;
    }
  }
}

export class LinkedList {
  constructor() {
    this.tail = null;
    this.head = null;
    this.length = 0;
  }

  removeNode (node) {
    if (!node || !(node instanceof Node)) return;

    if (node.list !== this) {
      throw new Error('removing node which does not belong to this list');
    }
  
    var next = node.next;
    var prev = node.prev;
  
    if (next) {
      next.prev = prev;
    }
  
    if (prev) {
      prev.next = next;
    }
  
    if (node === this.head) {
      this.head = next;
    }
    if (node === this.tail) {
      this.tail = prev;
    }
  
    node.list.length--;
    node.next = null;
    node.prev = null;
    node.list = null;
  
    return next;
  }

  unshiftNode (node) {
    if (!node || !(node instanceof Node)) return;

    if (node === this.head) {
      return;
    }
  
    if (node.list) {
      node.list.removeNode(node);
    }
  
    var head = this.head;
    node.list = this;
    node.next = head;
    if (head) {
      head.prev = node;
    }
  
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
    this.length++;
  }

  unshift() {
    for (var i = 0, l = arguments.length; i < l; i++) {
      this.head = new Node(arguments[i], null, this.head, this);
      if (!this.tail) {
        this.tail = this.head;
      }
      this.length++;
    }
    return this.length;
  }
}
