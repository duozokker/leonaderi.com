export function AdminLegend() {
  return (
    <div className="admin-legend">
      <strong>Legende</strong>
      <p>`F8` Admin an/aus</p>
      <p>Outline Farben: Orange = Objektgroesse, Blau/Tuerkis = Hitbox</p>
      <p>Live: Hitbox anklicken, innen ziehen = verschieben</p>
      <p>Live: Hitbox-Ecken ziehen = groesser/kleiner</p>
      <p>Live: Z/X/C/V = globalen Map-Offset feinjustieren</p>
      <p>Full Map: Mausrad zoomt, Drag verschiebt Kamera, Fit fuer Gesamtansicht</p>
      <p>Export/Import: Patch lokal sichern oder laden</p>
    </div>
  )
}
