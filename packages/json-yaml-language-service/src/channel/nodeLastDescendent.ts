/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ELsNode } from "./types";

/**
 * From a node goes all the way down to its last descendent
 *
 * @param node the node where to start
 * @param nodeType the node type where to stop
 * @returns the parent node if found, undefined otherwise
 */
export function nodeLastDescendent(node: ELsNode): ELsNode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  const lastChild = node.children.reduce((prev, curr) => {
    if (curr.offset > prev.offset) {
      return curr;
    }
    return prev;
  }, node.children[0]);

  return nodeLastDescendent(lastChild);
}
