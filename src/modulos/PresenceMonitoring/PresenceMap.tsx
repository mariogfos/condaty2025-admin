"use client";

import {
  Check,
  Crosshair,
  Layers3,
  MapPin,
  MapPinned,
  MousePointer2,
  Navigation,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./PresenceMonitoring.module.css";
import {
  Coordinate,
  PresenceConnection,
  PresencePlace,
  PresenceScope,
  productLabels,
} from "./types";

type ContextMenuState = { x: number; y: number; place: PresencePlace | null };
type DrawingState = {
  mode: "create" | "edit";
  place: PresencePlace | null;
  points: Coordinate[];
};
type PendingSaveState = {
  mode: "create" | "edit";
  place: PresencePlace | null;
  clientId: string;
  boundary: Coordinate[];
};

type Props = {
  connections: PresenceConnection[];
  selected: PresenceConnection | null;
  places: PresencePlace[];
  scopes: PresenceScope[];
  onSelect: (connection: PresenceConnection | null) => void;
  onCreatePlace: (clientId: string, boundary: Coordinate[]) => Promise<void>;
  onUpdatePlace: (id: number, boundary: Coordinate[]) => Promise<void>;
  onDeletePlace: (id: number) => Promise<void>;
};

const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

export default function PresenceMap({
  connections,
  selected,
  places,
  scopes,
  onSelect,
  onCreatePlace,
  onUpdatePlace,
  onDeletePlace,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const connectionsRef = useRef(connections);
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelect);
  const drawingRef = useRef<DrawingState | null>(null);
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSaveState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PresencePlace | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const connectionsGeoJson = useMemo<FeatureCollection<Point>>(() => ({
    type: "FeatureCollection",
    features: connections
      .filter((connection) => connection.coordinates !== null)
      .map((connection) => ({
        type: "Feature",
        properties: { id: connection.id, product: connection.product },
        geometry: { type: "Point", coordinates: connection.coordinates! },
      })),
  }), [connections]);
  const placesGeoJson = useMemo<FeatureCollection<Polygon>>(() => ({
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      id: place.id,
      properties: { id: place.id, name: place.name, color: place.color },
      geometry: { type: "Polygon", coordinates: [place.boundary] },
    })),
  }), [places]);
  const connectionsGeoJsonRef = useRef(connectionsGeoJson);
  const placesGeoJsonRef = useRef(placesGeoJson);
  const availableScopes = scopes.filter((scope) => !scope.has_place);

  const queueSave = useCallback((current: DrawingState, boundary: Coordinate[]) => {
    setPendingSave({
      mode: current.mode,
      place: current.place,
      clientId: current.place?.client_id || "",
      boundary,
    });
    setActionError(null);
  }, []);

  useEffect(() => { connectionsRef.current = connections; }, [connections]);
  useEffect(() => { placesRef.current = places; }, [places]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { connectionsGeoJsonRef.current = connectionsGeoJson; }, [connectionsGeoJson]);
  useEffect(() => { placesGeoJsonRef.current = placesGeoJson; }, [placesGeoJson]);

  useEffect(() => {
    if (!mapToken || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          lightPreset: "night",
          show3dObjects: true,
          colorLand: "#090f0e",
          colorWater: "#06110f",
          colorGreenspace: "#10231d",
          colorCommercial: "#101817",
          colorEducation: "#111a18",
          colorMedical: "#121a19",
          colorIndustrial: "#0d1514",
          colorBuildings: "#17211f",
          colorRoads: "#5b6965",
          colorTrunks: "#71847d",
          colorMotorways: "#879b93",
          colorAdminBoundaries: "#3d514b",
          colorPlaceLabels: "#c1ceca",
          colorRoadLabels: "#7c8d88",
          colorPointOfInterestLabels: "#7c8d88",
          colorModePointOfInterestLabels: "single",
        },
      },
      center: [-63.18, -17.78],
      zoom: 10.9,
      projection: "mercator",
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource("presence-places", { type: "geojson", data: placesGeoJsonRef.current });
      map.addLayer({
        id: "presence-places-fill",
        type: "fill",
        source: "presence-places",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.14,
          "fill-emissive-strength": 0.35,
        },
      });
      map.addLayer({
        id: "presence-places-outline",
        type: "line",
        source: "presence-places",
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": 0.92,
          "line-width": 2.4,
          "line-emissive-strength": 0.8,
        },
      });
      map.addLayer({
        id: "presence-places-label",
        type: "symbol",
        source: "presence-places",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-letter-spacing": 0.08,
        },
        paint: {
          "text-color": ["get", "color"],
          "text-halo-color": "rgba(5,8,9,0.96)",
          "text-halo-width": 1.4,
          "text-emissive-strength": 1,
        },
      });

      map.addSource("presence-place-draft", { type: "geojson", data: emptyDraftCollection() });
      map.addLayer({
        id: "presence-place-draft-fill",
        type: "fill",
        source: "presence-place-draft",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#00e38c", "fill-opacity": 0.12, "fill-emissive-strength": 0.4 },
      });
      map.addLayer({
        id: "presence-place-draft-line",
        type: "line",
        source: "presence-place-draft",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": "#00e38c",
          "line-width": 2.5,
          "line-dasharray": [1.5, 1.2],
          "line-emissive-strength": 1,
        },
      });
      map.addLayer({
        id: "presence-place-draft-points",
        type: "circle",
        source: "presence-place-draft",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": ["case", ["get", "isStart"], 8, 5],
          "circle-color": ["case", ["get", "isStart"], "#00e38c", "#f1f7f4"],
          "circle-stroke-color": "#07100d",
          "circle-stroke-width": 3,
          "circle-emissive-strength": 1,
        },
      });

      map.addSource("presence-connections", {
        type: "geojson",
        data: connectionsGeoJsonRef.current,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 46,
      });
      map.addSource("presence-connections-heat-source", {
        type: "geojson",
        data: connectionsGeoJsonRef.current,
      });
      map.addLayer({
        id: "presence-connections-heat",
        type: "heatmap",
        source: "presence-connections-heat-source",
        maxzoom: 12.5,
        paint: {
          "heatmap-weight": 0.9,
          "heatmap-intensity": 0.85,
          "heatmap-radius": 34,
          "heatmap-opacity": 0.52,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,227,140,0)",
            0.35, "rgba(0,227,140,0.18)",
            0.7, "rgba(0,227,140,0.58)",
            1, "rgba(218,255,244,0.95)",
          ],
        },
      });
      map.addLayer({
        id: "presence-connection-points",
        type: "circle",
        source: "presence-connections",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match", ["get", "product"],
            "admin", "#ffbe5c",
            "resident", "#52a8ff",
            "guard", "#a985ff",
            "#00e38c",
          ],
          "circle-stroke-color": "#07100d",
          "circle-stroke-width": 3,
          "circle-emissive-strength": 1,
        },
      });
      map.addLayer({
        id: "presence-connection-clusters",
        type: "circle",
        source: "presence-connections",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 25],
          "circle-color": "#00e38c",
          "circle-stroke-color": "rgba(7,16,13,0.8)",
          "circle-stroke-width": 4,
          "circle-emissive-strength": 1,
        },
      });
      map.addLayer({
        id: "presence-connection-cluster-count",
        type: "symbol",
        source: "presence-connections",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 11 },
        paint: { "text-color": "#001a12", "text-emissive-strength": 1 },
      });

      map.on("click", "presence-connection-points", (event) => {
        if (drawingRef.current) return;
        const id = event.features?.[0]?.properties?.id;
        const connection = connectionsRef.current.find((item) => item.id === id);
        if (connection) onSelectRef.current(connection);
      });
      map.on("click", "presence-connection-clusters", (event) => {
        if (drawingRef.current) return;
        const feature = event.features?.[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== "Point") return;
        const coordinates = feature.geometry.coordinates as Coordinate;
        const source = map.getSource("presence-connections") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (clusterError, zoom) => {
          if (clusterError || zoom === null || zoom === undefined) return;
          map.easeTo({ center: coordinates, zoom });
        });
      });
      for (const layer of ["presence-connection-points", "presence-connection-clusters"]) {
        map.on("mouseenter", layer, () => {
          if (!drawingRef.current) map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          if (!drawingRef.current) map.getCanvas().style.cursor = "";
        });
      }

      map.on("click", (event) => {
        setContextMenu(null);
        const current = drawingRef.current;
        if (!current) return;
        const coordinate = roundedCoordinate(event.lngLat.lng, event.lngLat.lat);
        const first = current.points[0];
        if (first && current.points.length >= 3 && pointDistance(event.point, map.project(first)) <= 18) {
          queueSave(current, [...current.points, first]);
          drawingRef.current = null;
          setDrawing(null);
          updateDraftSource(map, null, null);
          map.getCanvas().style.cursor = "";
          return;
        }
        if (current.points.length >= 200) {
          setActionError("El perímetro alcanzó el máximo de 200 puntos.");
          return;
        }
        const previous = current.points.at(-1);
        if (previous && pointDistance(map.project(previous), event.point) < 4) return;
        const next = { ...current, points: [...current.points, coordinate] };
        drawingRef.current = next;
        setDrawing(next);
        setActionError(null);
        updateDraftSource(map, next, null);
      });
      map.on("mousemove", (event) => {
        const current = drawingRef.current;
        if (!current) return;
        const first = current.points[0];
        const closesBoundary = Boolean(first && current.points.length >= 3 && pointDistance(event.point, map.project(first)) <= 18);
        const cursor = closesBoundary && first ? first : roundedCoordinate(event.lngLat.lng, event.lngLat.lat);
        updateDraftSource(map, current, cursor);
        map.getCanvas().style.cursor = closesBoundary ? "pointer" : "crosshair";
      });
      map.on("mouseleave", () => {
        if (drawingRef.current) updateDraftSource(map, drawingRef.current, null);
      });
      map.on("contextmenu", (event) => {
        event.originalEvent.preventDefault();
        if (drawingRef.current) return;
        const blocked = map.queryRenderedFeatures(event.point, {
          layers: [
            "presence-connection-points",
            "presence-connection-clusters",
            "presence-connection-cluster-count",
          ],
        });
        if (blocked.length > 0) {
          setContextMenu(null);
          return;
        }
        const feature = map.queryRenderedFeatures(event.point, { layers: ["presence-places-fill"] })[0];
        const placeId = Number(feature?.properties?.id);
        const place = Number.isFinite(placeId)
          ? placesRef.current.find((item) => item.id === placeId) || null
          : null;
        const width = 238;
        const height = place ? 168 : 116;
        setContextMenu({
          x: Math.max(12, Math.min(event.point.x, map.getContainer().clientWidth - width - 12)),
          y: Math.max(12, Math.min(event.point.y, map.getContainer().clientHeight - height - 12)),
          place,
        });
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [queueSave]);

  useEffect(() => {
    (mapRef.current?.getSource("presence-connections") as mapboxgl.GeoJSONSource | undefined)?.setData(connectionsGeoJson);
    (mapRef.current?.getSource("presence-connections-heat-source") as mapboxgl.GeoJSONSource | undefined)?.setData(connectionsGeoJson);
  }, [connectionsGeoJson]);

  useEffect(() => {
    (mapRef.current?.getSource("presence-places") as mapboxgl.GeoJSONSource | undefined)?.setData(placesGeoJson);
  }, [placesGeoJson]);

  useEffect(() => {
    if (selected?.coordinates && mapRef.current) {
      mapRef.current.easeTo({ center: selected.coordinates, duration: 500 });
    }
  }, [selected]);

  const beginDrawing = (place: PresencePlace | null) => {
    const next: DrawingState = { mode: place ? "edit" : "create", place, points: [] };
    drawingRef.current = next;
    setDrawing(next);
    setContextMenu(null);
    setPendingSave(null);
    setPendingDelete(null);
    setActionError(null);
    updateDraftSource(mapRef.current, next, null);
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "crosshair";
  };

  const cancelDrawing = useCallback(() => {
    drawingRef.current = null;
    setDrawing(null);
    setActionError(null);
    updateDraftSource(mapRef.current, null, null);
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
  }, []);

  const finishDrawing = () => {
    const current = drawingRef.current;
    const first = current?.points[0];
    if (!current || !first || current.points.length < 3) return;
    queueSave(current, [...current.points, first]);
    cancelDrawing();
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pendingSave && !saving) setPendingSave(null);
      else if (pendingDelete && !saving) setPendingDelete(null);
      else if (drawingRef.current) cancelDrawing();
      else setContextMenu(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [cancelDrawing, pendingDelete, pendingSave, saving]);

  const savePending = async () => {
    if (!pendingSave) return;
    if (pendingSave.mode === "create" && !pendingSave.clientId) {
      setActionError("Selecciona el condominio que corresponde a esta área.");
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      if (pendingSave.mode === "create") {
        await onCreatePlace(pendingSave.clientId, pendingSave.boundary);
      } else if (pendingSave.place) {
        await onUpdatePlace(pendingSave.place.id, pendingSave.boundary);
      }
      setPendingSave(null);
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const deletePending = async () => {
    if (!pendingDelete) return;
    setSaving(true);
    setActionError(null);
    try {
      await onDeletePlace(pendingDelete.id);
      setPendingDelete(null);
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const toggleHeatmap = () => {
    const next = !heatmapVisible;
    setHeatmapVisible(next);
    const map = mapRef.current;
    if (map?.getLayer("presence-connections-heat")) {
      map.setLayoutProperty("presence-connections-heat", "visibility", next ? "visible" : "none");
    }
  };

  const fitConnections = () => {
    const points = connections.flatMap((connection) => connection.coordinates ? [connection.coordinates] : []);
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    const bounds = points.reduce(
      (result, point) => result.extend(point),
      new mapboxgl.LngLatBounds(points[0], points[0]),
    );
    map.fitBounds(bounds, { padding: 120, maxZoom: 15, duration: 650 });
  };

  return (
    <section className={`${styles.mapStage} ${drawing ? styles.mapDrawing : ""}`} aria-label="Mapa de conexiones">
      <div ref={containerRef} className={styles.mapCanvas} />
      {!mapToken ? (
        <div className={styles.mapFallback}>
          <MapPin size={28} />
          <strong>Mapa pendiente de configuración</strong>
          <span>Agrega el token público de Mapbox al ambiente de rAdmin.</span>
        </div>
      ) : null}

      <div className={styles.mapToolbar} aria-label="Controles del mapa">
        <button type="button" aria-label="Alternar mapa de calor" aria-pressed={heatmapVisible} onClick={toggleHeatmap}><Layers3 size={17} /></button>
        <button type="button" aria-label="Centrar conexiones" onClick={fitConnections}><Crosshair size={17} /></button>
        <button type="button" aria-label="Restablecer orientación" onClick={() => mapRef.current?.resetNorthPitch({ duration: 500 })}><Navigation size={17} /></button>
      </div>

      {contextMenu ? (
        <div className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }} role="menu">
          <header><span>{contextMenu.place ? "Condominio" : "Mapa"}</span><strong>{contextMenu.place?.name || "Nuevo condominio"}</strong></header>
          {contextMenu.place ? (
            <>
              <button type="button" role="menuitem" onClick={() => beginDrawing(contextMenu.place)}>
                <PencilLine size={16} /><span><strong>Editar área</strong><small>Redibujar el perímetro</small></span>
              </button>
              <button
                type="button"
                className={styles.dangerAction}
                role="menuitem"
                onClick={() => { setPendingDelete(contextMenu.place); setContextMenu(null); setActionError(null); }}
              >
                <Trash2 size={16} /><span><strong>Eliminar lugar</strong><small>Quitarlo del mapa</small></span>
              </button>
            </>
          ) : (
            <button type="button" role="menuitem" disabled={availableScopes.length === 0} onClick={() => beginDrawing(null)}>
              <Plus size={16} /><span><strong>Agregar condominio</strong><small>{availableScopes.length ? "Delimitar su área en el mapa" : "Todos los condominios ya tienen área"}</small></span>
            </button>
          )}
        </div>
      ) : null}

      {drawing ? (
        <div className={styles.drawingPanel} role="status">
          <span className={styles.drawingIcon}><MousePointer2 size={17} /></span>
          <div>
            <strong>{drawing.mode === "edit" ? `Redibujando ${drawing.place?.name}` : "Delimita el condominio"}</strong>
            <small>Haz clic en el mapa y vuelve al primer punto para cerrar.</small>
          </div>
          <span className={styles.drawingCount}>{drawing.points.length}</span>
          <button className={styles.finishButton} type="button" disabled={drawing.points.length < 3} onClick={finishDrawing}><Check size={15} /> Finalizar</button>
          <button className={styles.cancelDrawing} type="button" aria-label="Cancelar dibujo" onClick={cancelDrawing}><X size={16} /></button>
        </div>
      ) : null}

      {selected ? (
        <article className={styles.connectionDetail}>
          <header>
            <div>
              <span className={`${styles.detailProduct} ${styles[`detail${capitalize(selected.product)}`]}`}>{productLabels[selected.product]}</span>
              <h2>{selected.name}</h2>
              <p>{selected.role}</p>
            </div>
            <span className={selected.state === "active" ? styles.livePill : styles.recentPill}>
              {selected.state === "active" ? "En línea" : "Reciente"}
            </span>
          </header>
          <dl>
            <div><dt>Condominio</dt><dd>{selected.scope_name}</dd></div>
            <div><dt>Dispositivo</dt><dd>{selected.device}</dd></div>
            <div><dt>Sistema</dt><dd>{selected.os || "No identificado"}</dd></div>
          </dl>
          <footer><MapPinned size={14} /> Posición referencial del condominio</footer>
        </article>
      ) : null}

      {pendingSave ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="save-place-title">
            <span className={styles.dialogIcon}><MapPinned size={20} /></span>
            <p className={styles.dialogEyebrow}>Condominio</p>
            <h2 id="save-place-title">{pendingSave.mode === "create" ? "Asignar condominio" : "Guardar nuevo perímetro"}</h2>
            <p>{pendingSave.mode === "create" ? "Relaciona este perímetro con un condominio activo." : `Se conservarán el nombre y color de ${pendingSave.place?.name}.`}</p>
            {pendingSave.mode === "create" ? (
              <label>
                Condominio
                <select value={pendingSave.clientId} onChange={(event) => setPendingSave({ ...pendingSave, clientId: event.target.value })} autoFocus>
                  <option value="">Seleccionar condominio</option>
                  {availableScopes.map((scope) => <option key={scope.id} value={scope.id}>{scope.name}</option>)}
                </select>
              </label>
            ) : null}
            <div className={styles.dialogSummary}><span>Puntos del perímetro</span><strong>{Math.max(0, pendingSave.boundary.length - 1)}</strong></div>
            {actionError ? <div className={styles.dialogError}>{actionError}</div> : null}
            <footer>
              <button className={styles.secondaryButton} type="button" disabled={saving} onClick={() => setPendingSave(null)}>Cancelar</button>
              <button className={styles.primaryButton} type="button" disabled={saving} onClick={() => void savePending()}>{saving ? "Guardando…" : pendingSave.mode === "create" ? "Guardar condominio" : "Guardar cambios"}</button>
            </footer>
          </section>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section className={`${styles.dialog} ${styles.dangerDialog}`} role="alertdialog" aria-modal="true" aria-labelledby="delete-place-title">
            <span className={styles.dialogIcon}><Trash2 size={20} /></span>
            <p className={styles.dialogEyebrow}>Eliminar lugar</p>
            <h2 id="delete-place-title">¿Quitar {pendingDelete.name} del mapa?</h2>
            <p>Se eliminará únicamente su perímetro de monitoreo. El condominio y sus datos operativos no cambian.</p>
            {actionError ? <div className={styles.dialogError}>{actionError}</div> : null}
            <footer>
              <button className={styles.secondaryButton} type="button" disabled={saving} onClick={() => setPendingDelete(null)}>Cancelar</button>
              <button className={styles.dangerButton} type="button" disabled={saving} onClick={() => void deletePending()}>{saving ? "Eliminando…" : "Eliminar lugar"}</button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}

type DraftGeometry = LineString | Point | Polygon;

function emptyDraftCollection(): FeatureCollection<DraftGeometry> {
  return { type: "FeatureCollection", features: [] };
}

function updateDraftSource(map: mapboxgl.Map | null, drawing: DrawingState | null, cursor: Coordinate | null) {
  const source = map?.getSource("presence-place-draft") as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;
  if (!drawing) {
    source.setData(emptyDraftCollection());
    return;
  }

  const linePoints = cursor ? [...drawing.points, cursor] : drawing.points;
  const features: Feature<DraftGeometry>[] = drawing.points.map((point, index) => ({
    type: "Feature",
    properties: { isStart: index === 0 },
    geometry: { type: "Point", coordinates: point },
  }));
  if (linePoints.length >= 2) {
    features.unshift({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: linePoints },
    });
  }
  if (linePoints.length >= 3) {
    features.unshift({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [[...linePoints, linePoints[0]]] },
    });
  }
  source.setData({ type: "FeatureCollection", features });
}

function roundedCoordinate(longitude: number, latitude: number): Coordinate {
  return [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))];
}

function pointDistance(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "No se pudo completar la operación.";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
