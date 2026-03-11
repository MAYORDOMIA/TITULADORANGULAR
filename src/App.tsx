/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import ControlPanel from "./components/ControlPanel";
import TitlerOutput from "./components/TitlerOutput";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ControlPanel />} />
        <Route path="/output" element={<TitlerOutput />} />
      </Routes>
    </BrowserRouter>
  );
}
