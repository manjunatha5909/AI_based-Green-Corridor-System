import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Hospital,
  MapPin,
  Activity,
  Sliders,
  ArrowRightLeft,
  Navigation,
  X,
  Square,
} from "lucide-react";
import InteractiveMap from "../components/InteractiveMap";
import LiveTelemetryHUD from "../components/LiveTelemetryHUD";
import CorridorConsole from "../components/CorridorConsole";
import TripReportModal from "../components/TripReportModal";
import { createRoute, startCorridor, activateSignal, resetCorridorApi, checkBackendHealth, endTrip, updateLocation } from "../services/corridorApi";
import { useAccessibility } from "../context/useAccessibility";
import { BENGALURU_SOURCES, BENGALURU_DESTINATIONS } from "../utils/locations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dlon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dlon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dlon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function Dashboard({ rapidWayRequest = null, onOpenRapidWay }) {
  const { announce, playBeep, speak } = useAccessibility();

  const [selectedSource, setSelectedSource] = useState("MG Road Metro Station");
  const [selectedDestination, setSelectedDestination] = useState("Victoria Hospital Trauma Center");

  const [sourceCoords, setSourceCoords] = useState({ lat: 12.9756, lon: 77.6066 });
  const [destCoords, setDestCoords] = useState({ lat: 12.9628, lon: 77.5746 });

  const [routeData, setRouteData] = useState(null);
  const [activeSignalIndex, setActiveSignalIndex] = useState(-1);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [vehicleWaypointIndex, setVehicleWaypointIndex] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentStreet, setCurrentStreet] = useState("Standby");
  const [nextManeuver, setNextManeuver] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [operationMode, setOperationMode] = useState("demo");
  const [gpsError, setGpsError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [trackingMode, setTrackingMode] = useState("demo");
  const [vehicleId, setVehicleId] = useState("AMB-BLR-108");
  const [locationShareStatus, setLocationShareStatus] = useState("idle");
  const [sharedLocation, setSharedLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");

  // Active Trip & Report states
  const [isTripActive, setIsTripActive] = useState(false);
  const [tripReport, setTripReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [eventLogs, setEventLogs] = useState([
    {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      text: "AI Green Corridor Command Center Initialized and Online.",
      type: "system",
    },
  ]);

  const autoRunTimerRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const locationShareWatchRef = useRef(null);
  const ambulancePositionRef = useRef(null);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    if (rapidWayRequest) return undefined;
    let isMounted = true;
    const verify = async () => {
      const res = await checkBackendHealth();
      if (isMounted) setBackendOnline(res.online);
    };
    verify();
    const interval = setInterval(verify, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const addLog = useCallback((text, type = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEventLogs((prev) => [{ time, text, type }, ...prev.slice(0, 24)]);
  }, []);

  const setVehicleToWaypoint = useCallback(
    (wpIdx, routePoints, bearings) => {
      if (!routePoints || routePoints.length === 0) return;
      const idx = Math.min(wpIdx, routePoints.length - 1);
      const pt = routePoints[idx];
      let bearing = 0;

      if (bearings && bearings[idx] !== undefined) {
        bearing = bearings[idx];
      } else if (idx < routePoints.length - 1) {
        const nextPt = routePoints[idx + 1];
        bearing = calculateBearing(pt[0], pt[1], nextPt[0], nextPt[1]);
      }

      setAmbulancePos({ lat: pt[0], lon: pt[1], bearing });
      setVehicleWaypointIndex(idx);
    },
    []
  );

  const handleRouteCalculated = useCallback(
    (data, src, dst) => {
      // Ensure all traffic signals start in RED (STOP) state until ambulance passes
      const initialSignalStates = (data.signal_states || data.traffic_signals || []).map((s) => ({
        ...s,
        state: "RED",
      }));

      setRouteData({
        ...data,
        signal_states: initialSignalStates,
      });

      if (src) {
        setSourceCoords(src);
        if (src.name) setSelectedSource(src.name);
      }
      if (dst) {
        setDestCoords(dst);
        if (dst.name) setSelectedDestination(dst.name);
      }
      setActiveSignalIndex(-1);
      setVehicleWaypointIndex(0);
      setCurrentSpeed(0);

      if (data.steps && data.steps.length > 0) {
        setCurrentStreet(data.steps[0].street || "Origin");
        setNextManeuver(data.steps[0].instruction || null);
      }

      if (data.route && data.route.length > 0) {
        setVehicleToWaypoint(0, data.route, data.route_bearings);
      }

      const logText = `Route Calculated: ${data.distance_km} km with ${data.traffic_signals?.length || 0} real junctions synced.`;
      addLog(logText, "success");
    },
    [addLog, setVehicleToWaypoint]
  );

  useEffect(() => {
    if (rapidWayRequest) return undefined;
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const data = await createRoute("MG Road Metro Station", "Victoria Hospital Trauma Center");
        if (isMounted) {
          handleRouteCalculated(
            data,
            { lat: 12.9756, lon: 77.6066, name: "MG Road Metro Station" },
            { lat: 12.9628, lon: 77.5746, name: "Victoria Hospital Trauma Center" }
          );
        }
      } catch (err) {
        console.warn("Backend route init failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [handleRouteCalculated, rapidWayRequest]);

  const handleDispatchRoute = useCallback(async (srcQuery, dstQuery) => {
    if (!srcQuery || !dstQuery) return;
    setIsLoading(true);
    try {
      const data = await createRoute(srcQuery, dstQuery);
      const srcCoord =
        data.route && data.route.length > 0
          ? { lat: data.route[0][0], lon: data.route[0][1], name: srcQuery }
          : null;
      const dstCoord =
        data.route && data.route.length > 0
          ? { lat: data.route[data.route.length - 1][0], lon: data.route[data.route.length - 1][1], name: dstQuery }
          : null;
      handleRouteCalculated(data, srcCoord, dstCoord);
      announce(`Calculated green corridor route between ${srcQuery} and ${dstQuery}`);
      playBeep("green");
    } catch (err) {
      addLog(`Route failed: ${err.message}`, "error");
      announce("Route calculation failed.");
      playBeep("red");
    } finally {
      setIsLoading(false);
    }
  }, [addLog, announce, handleRouteCalculated, playBeep]);

  useEffect(() => {
    if (!rapidWayRequest) return;
    setOperationMode(rapidWayRequest.mode || "demo");
    setGpsError("");
    if (rapidWayRequest.mode !== "live") {
      handleDispatchRoute(rapidWayRequest.source, rapidWayRequest.destination);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Live GPS is unavailable in this browser. Select Demo mode to continue.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentLocation = `${coords.latitude},${coords.longitude}`;
        setSelectedSource("Current GPS Location");
        handleDispatchRoute(currentLocation, rapidWayRequest.destination);
      },
      () => setGpsError("Location permission was denied. Select Demo mode or allow location access to continue."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleDispatchRoute, rapidWayRequest]);

  useEffect(() => {
    if (operationMode !== "live" || !routeData || !navigator.geolocation) return undefined;

    const updateGpsPosition = ({ coords }) => {
      const previous = ambulancePositionRef.current;
      const bearing = previous
        ? calculateBearing(previous.lat, previous.lon, coords.latitude, coords.longitude)
        : 0;
      setAmbulancePos({ lat: coords.latitude, lon: coords.longitude, bearing });
      ambulancePositionRef.current = { lat: coords.latitude, lon: coords.longitude, bearing };
      setCurrentSpeed(coords.speed ? Math.round(coords.speed * 3.6) : 0);
      setGpsError("");
    };
    const handleGpsError = () => setGpsError("GPS updates are unavailable. Check location access and device settings.");

    gpsWatchRef.current = navigator.geolocation.watchPosition(updateGpsPosition, handleGpsError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    });
    return () => {
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    };
  }, [operationMode, routeData]);

  const handleSwapLocations = () => {
    const prevSrc = selectedSource;
    const prevDst = selectedDestination;
    setSelectedSource(prevDst);
    setSelectedDestination(prevSrc);
    handleDispatchRoute(prevDst, prevSrc);
    playBeep("click");
  };

  const handleManualRouteSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleDispatchRoute(selectedSource, selectedDestination);
  };

  const handleStart = async () => {
    if (!routeData?.traffic_signals || routeData.traffic_signals.length === 0) return;
    setIsLoading(true);
    try {
      const data = await startCorridor();
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setActiveSignalIndex(0);
      setCurrentSpeed(65);

      if (routeData.route && routeData.route.length > 0) {
        setVehicleToWaypoint(0, routeData.route, routeData.route_bearings);
      }

      addLog("Green Corridor Started! Junction #1 cleared to GREEN.", "success");
      announce("Green Corridor Started. Junction 1 is green.");
      speak("Green corridor activated. Junction one is green.");
      playBeep("siren");
    } catch (err) {
      addLog("Could not start green corridor: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDemo = async (restart = false) => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (isAutoRunning && !restart) {
      if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
      setIsAutoRunning(false);
      setCurrentSpeed(0);
      addLog("Live Demo Paused.", "info");
      announce("Simulation paused");
      return;
    }

    let activeRoute = routeData;
    if (!activeRoute?.route || activeRoute.route.length === 0) {
      setIsLoading(true);
      try {
        const data = await createRoute(selectedSource, selectedDestination);
        const srcCoord =
          data.route && data.route.length > 0
            ? { lat: data.route[0][0], lon: data.route[0][1], name: selectedSource }
            : null;
        const dstCoord =
          data.route && data.route.length > 0
            ? { lat: data.route[data.route.length - 1][0], lon: data.route[data.route.length - 1][1], name: selectedDestination }
            : null;
        handleRouteCalculated(data, srcCoord, dstCoord);
        activeRoute = data;
        mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        addLog(`Demo route failed: ${err.message}`, "error");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    if (!activeRoute?.route || activeRoute.route.length === 0) return;

    const totalWaypoints = activeRoute.route.length;
    const signals = activeRoute.traffic_signals || [];
    const steps = activeRoute.steps || [];

    // Local mutable copy of all signal states for this demo run
    const currentSignalStates = (activeRoute.signal_states || signals).map((s) => ({
      ...s,
      state: "RED", // All signals start RED!
    }));

    const clearedIndices = new Set();
    let wpIdx = restart ? 0 : vehicleWaypointIndex;

    if (wpIdx === 0) {
      // Progressive Signal Wave: Signal 1 starts in PREPARE!
      if (currentSignalStates.length > 0) {
        currentSignalStates[0] = { ...currentSignalStates[0], state: "PREPARE" };
        setActiveSignalIndex(0);
      } else {
        setActiveSignalIndex(-1);
      }
      setVehicleToWaypoint(0, activeRoute.route, activeRoute.route_bearings);
      setRouteData((prev) => (prev ? { ...prev, signal_states: [...currentSignalStates] } : prev));
      if (signals.length > 0) {
        addLog(`🚦 Signal #1 (${signals[0]?.name || "Junction 1"}) → PREPARE`, "warning");
      }
    } else {
      // If resuming midway, preserve signals that were already passed
      for (let i = 0; i < signals.length; i++) {
        const sig = signals[i];
        const sigWp = sig.waypoint_index !== undefined ? sig.waypoint_index : Math.floor((i + 1) * (totalWaypoints / (signals.length + 1)));
        if (wpIdx >= sigWp) {
          clearedIndices.add(i);
          currentSignalStates[i] = { ...currentSignalStates[i], state: "CLEARED" };
        }
      }
      // Next upcoming signal starts in PREPARE
      const nextUpcoming = signals.findIndex((_, idx) => !clearedIndices.has(idx));
      if (nextUpcoming >= 0) {
        currentSignalStates[nextUpcoming] = { ...currentSignalStates[nextUpcoming], state: "PREPARE" };
        setActiveSignalIndex(nextUpcoming);
      }
      setRouteData((prev) => (prev ? { ...prev, signal_states: [...currentSignalStates] } : prev));
    }

    setIsAutoRunning(true);
    setIsTripActive(true);
    addLog(`Live Demo Running: Ambulance moving towards ${selectedDestination}!`, "success");
    announce("Live emergency corridor demo started");
    speak(`Emergency ambulance moving towards ${selectedDestination}.`);
    playBeep("siren");

    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);

    autoRunTimerRef.current = setInterval(() => {
      const stepJump = Math.max(1, Math.floor(totalWaypoints / 70));
      wpIdx = Math.min(wpIdx + stepJump, totalWaypoints - 1);

      setVehicleToWaypoint(wpIdx, activeRoute.route, activeRoute.route_bearings);

      const currentSpd = Math.round(62 + Math.sin(wpIdx * 0.35) * 8);
      setCurrentSpeed(currentSpd);

      const currentPos = activeRoute.route[wpIdx];

      if (locationShareStatus === "sent" && trackingMode === "demo") {
        sendSharedLocation({
          latitude: currentPos[0],
          longitude: currentPos[1],
          accuracy: 1.2,
          timestamp: Date.now(),
        }).catch(() => undefined);
      }

      // Update current street & next maneuver
      for (const step of steps) {
        if (step.location) {
          const dLat = Math.abs(currentPos[0] - step.location[0]);
          const dLon = Math.abs(currentPos[1] - step.location[1]);
          if (dLat < 0.0035 && dLon < 0.0035) {
            setCurrentStreet(step.street || "Main Road");
            setNextManeuver(step.instruction || null);
          }
        }
      }

      // Check each traffic signal along the corridor:
      // Sequential progression:
      // 1. Upcoming signal is in PREPARE
      // 2. When ambulance reaches/crosses Signal X -> changes to GREEN / CLEARED
      // 3. Next upcoming signal X+1 -> changes to PREPARE
      for (let sIdx = 0; sIdx < signals.length; sIdx++) {
        if (clearedIndices.has(sIdx)) continue; // Already cleared

        const sig = signals[sIdx];
        const sigWp = sig.waypoint_index !== undefined
          ? sig.waypoint_index
          : Math.floor((sIdx + 1) * (totalWaypoints / (signals.length + 1)));

        // Distance in km between current ambulance position and this traffic signal
        const distKm = Math.hypot(
          (currentPos[0] - sig.lat) * 111,
          (currentPos[1] - sig.lon) * 111 * Math.cos((sig.lat * Math.PI) / 180)
        );

        // TRIGGER: When the ambulance reaches/crosses the junction (within 280m or reaching the junction waypoint)
        const isPassing = distKm <= 0.28 || wpIdx >= (sigWp - 1);

        if (isPassing) {
          clearedIndices.add(sIdx);
          currentSignalStates[sIdx] = { ...currentSignalStates[sIdx], state: "CLEARED" };

          // Advance next signal to PREPARE
          const nextSigIdx = sIdx + 1;
          if (nextSigIdx < signals.length) {
            currentSignalStates[nextSigIdx] = { ...currentSignalStates[nextSigIdx], state: "PREPARE" };
            setActiveSignalIndex(nextSigIdx);
            addLog(`🚦 Signal #${sIdx + 1} (${sig.name}) → GREEN / CLEARED. Next: Signal #${nextSigIdx + 1} (${signals[nextSigIdx].name}) → PREPARE`, "success");
          } else {
            setActiveSignalIndex(sIdx);
            addLog(`🚦 Final Signal #${sIdx + 1} (${sig.name}) → GREEN / CLEARED. All corridor junctions cleared!`, "success");
          }

          // Immediately update routeData so InteractiveMap, HUD, and matrix re-render
          setRouteData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              signal_states: [...currentSignalStates],
            };
          });

          announce(`Junction ${sIdx + 1} cleared`);
          speak(`Signal ${sIdx + 1} cleared. Next signal preparing.`);
          playBeep("green");
          break; // Process one clearance per tick
        }
      }

      if (wpIdx >= totalWaypoints - 1) {
        clearInterval(autoRunTimerRef.current);
        setIsAutoRunning(false);
        setCurrentSpeed(0);
        setCurrentStreet("Hospital Emergency Bay");
        setNextManeuver("Arrived safely at Trauma Center");
        addLog(`Ambulance arrived safely at ${selectedDestination}! Mission accomplished.`, "success");
        announce("Ambulance arrived at destination hospital.");
        speak("Emergency vehicle arrived safely at destination hospital.");
        playBeep("arrival");
      }
    }, 180);
  };

  const handleStopDemo = () => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    setIsTripActive(false);
    setCurrentSpeed(0);
    setActiveSignalIndex(-1);
    if (routeData?.route?.length) setVehicleToWaypoint(0, routeData.route, routeData.route_bearings);
    addLog("Demo simulation stopped.", "info");
  };

  const sendSharedLocation = useCallback(async ({ latitude, longitude, accuracy, timestamp }) => {
    const location = {
      lat: latitude,
      lon: longitude,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy * 10) / 10 : null,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      vehicle_id: vehicleId.trim() || "AMB-BLR-108",
      address: locationAddress || null,
      mode: trackingMode,
    };
    const data = await updateLocation(location);
    const received = data.location || location;
    setSharedLocation(received);
    setLocationShareStatus("sent");
    return received;
  }, [locationAddress, trackingMode, vehicleId]);

  const handleShareLocation = async () => {
    if (!routeData?.route?.length) {
      setLocationShareStatus("error");
      setGpsError("Create a corridor route before sharing a vehicle location.");
      return;
    }

    const confirmed = window.confirm("Location access requested. Your current location will be shared with the Traffic Control System.");
    if (!confirmed) return;

    if (trackingMode === "demo") {
      setOperationMode("demo");
      const demoPosition = ambulancePos || { lat: routeData.route[0][0], lon: routeData.route[0][1] };
      try {
        const received = await sendSharedLocation({
          latitude: demoPosition.lat,
          longitude: demoPosition.lon,
          accuracy: 1.2,
          timestamp: Date.now(),
        });
        setAmbulancePos((current) => ({ ...demoPosition, bearing: current?.bearing || 0 }));
        if (!isAutoRunning) handleStartDemo();
        addLog(`Demo location shared for ${received.vehicle_id}.`, "success");
      } catch (error) {
        setLocationShareStatus("error");
        setGpsError("Location could not be sent to Traffic Control. Please try again.");
        addLog(`Location transmission failed: ${error.message}`, "error");
      }
      return;
    }

    setOperationMode("live");
    if (!navigator.geolocation) {
      setLocationShareStatus("error");
      setGpsError("Unable to access GPS location. Please enable location permission and try again.");
      return;
    }

    setLocationShareStatus("requesting");
    setGpsError("");
    const handlePosition = async ({ coords, timestamp }) => {
      setGpsStatus("connected");
      setAmbulancePos((current) => ({
        lat: coords.latitude,
        lon: coords.longitude,
        bearing: current ? calculateBearing(current.lat, current.lon, coords.latitude, coords.longitude) : 0,
      }));
      setCurrentSpeed(coords.speed ? Math.round(coords.speed * 3.6) : 0);
      try {
        await sendSharedLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, timestamp });
      } catch (error) {
        setLocationShareStatus("error");
        setGpsError("Location could not be sent to Traffic Control. Please try again.");
        addLog(`Location transmission failed: ${error.message}`, "error");
      }
    };
    const handleGpsError = () => {
      setGpsStatus("denied");
      setLocationShareStatus("error");
      setGpsError("Unable to access GPS location. Please enable location permission and try again.");
    };
    navigator.geolocation.getCurrentPosition(handlePosition, handleGpsError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    locationShareWatchRef.current = navigator.geolocation.watchPosition(handlePosition, handleGpsError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    });
  };

  useEffect(() => () => {
    if (locationShareWatchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationShareWatchRef.current);
    }
  }, []);

  const handleEndTrip = async () => {
    // 1. Show confirmation
    const confirmed = window.confirm("Are you sure you want to end this trip?");
    if (!confirmed) return;

    // 2. Stop DEMO ambulance movement
    if (autoRunTimerRef.current) {
      clearInterval(autoRunTimerRef.current);
      autoRunTimerRef.current = null;
    }
    setIsAutoRunning(false);
    setCurrentSpeed(0);

    try {
      // 3. Call backend POST /route/end
      const result = await endTrip();

      // 4. End the active Green Corridor state
      setRouteData((prev) =>
        prev
          ? {
              ...prev,
              signal_states: prev.signal_states?.map((s) => ({ ...s, state: "RED" })) || [],
            }
          : null
      );
      setActiveSignalIndex(-1);

      // 5. Mark trip as completed
      setIsTripActive(false);

      // 6. Display the Trip Report returned by backend
      const report = result?.report || {
        trip_id: routeData?.trip_id || `TRIP-${Date.now()}`,
        ambulance_id: routeData?.ambulance_id || "AMB-BLR-108",
        start_location: selectedSource || "N/A",
        destination: selectedDestination || "N/A",
        distance: routeData?.distance_km ?? "N/A",
        planned_eta: routeData?.eta_minutes ?? "N/A",
        actual_duration: "N/A",
        traffic_adjusted_status: routeData?.traffic_adjusted ? "Adjusted" : "Optimal",
        signals_monitored: routeData?.traffic_signals?.length ?? "N/A",
        signals_cleared: routeData?.signal_states?.filter((s) => s.state === "GREEN" || s.state === "CLEARED").length || 0,
        delays: null,
        route_deviation: false,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        trip_status: "COMPLETED",
      };

      setTripReport(report);
      setIsReportModalOpen(true);

      addLog("Trip completed! Green Corridor Trip Report generated.", "success");
      announce("Trip completed. Green corridor report is ready.");
      speak("Trip ended. Official transit summary generated.");
      playBeep("arrival");
    } catch (err) {
      addLog(`Failed to end trip: ${err.message}`, "error");
    }
  };

  const handleAutoRun = () => {
    handleStartDemo();
  };

  const handleSignalOverride = async (signalId, idx) => {
    try {
      const data = await activateSignal(signalId);
      setRouteData((prev) => (prev ? { ...prev, signal_states: data.signal_states } : prev));
      setActiveSignalIndex(idx);
      addLog(`Manual Override: Signal #${signalId} switched to GREEN.`);
      announce(`Signal ${signalId} set to Green`);
      playBeep("green");
    } catch (err) {
      addLog(`Signal switch error: ${err.message}`, "error");
    }
  };

  const handleReset = async () => {
    if (autoRunTimerRef.current) clearInterval(autoRunTimerRef.current);
    setIsAutoRunning(false);
    setActiveSignalIndex(-1);
    setVehicleWaypointIndex(0);
    setCurrentSpeed(0);

    if (routeData?.route && routeData.route.length > 0) {
      setVehicleToWaypoint(0, routeData.route, routeData.route_bearings);
    }

    try {
      await resetCorridorApi();
    } catch (err) {
      console.warn("Backend reset error", err);
    }

    addLog("Corridor state and vehicle position reset.");
    announce("Corridor reset");
    playBeep("click");
  };

  const nextSignal =
    routeData?.traffic_signals && activeSignalIndex + 1 < routeData.traffic_signals.length
      ? {
          name: routeData.traffic_signals[activeSignalIndex + 1].name,
          distance_m: 450,
        }
      : null;

  return (
    <div className="space-y-6 pt-24 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Top Operations Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
                  Emergency Operations Command Center
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Real-World OpenStreetMap Shortest Path Routing, Live GPS Heading Tracking, and Dynamic Smart Traffic Wave.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-xs transition-colors ${
                  backendOnline
                    ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${backendOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`}
                />
                <span>{backendOnline ? "Flask Backend Linked (5000)" : "In-Browser Engine Active"}</span>
              </div>

              <Button
                variant="emerald"
                onClick={onOpenRapidWay}
                className="rounded-xl gap-2 shadow-xs"
              >
                <Radio className="w-4 h-4" />
                Rapid Way
              </Button>

              {/* End Trip Button (Only available while a trip is active) */}
              {(isTripActive || isAutoRunning) && (
                <Button
                  variant="destructive"
                  onClick={handleEndTrip}
                  className="rounded-xl gap-1.5 shadow-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  title="End current active emergency corridor trip"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>End Trip</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Source & Destination Selector Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleManualRouteSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Source Input */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Source (Origin Location)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Type place name or GPS</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    list="dashboard-source-datalist"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    placeholder="Type starting location, e.g. Koramangala..."
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                  {selectedSource && (
                    <button
                      type="button"
                      onClick={() => setSelectedSource("")}
                      title="Clear source"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="dashboard-source-datalist">
                    {BENGALURU_SOURCES.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.area})</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Swap Button */}
              <div className="hidden md:flex md:col-span-1 justify-center pb-1">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap Origin and Destination"
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination Input */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hospital className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Destination (Hospital Center)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Type trauma hospital</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    list="dashboard-dest-datalist"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    placeholder="Type destination hospital, e.g. Manipal..."
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  />
                  {selectedDestination && (
                    <button
                      type="button"
                      onClick={() => setSelectedDestination("")}
                      title="Clear destination"
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <datalist id="dashboard-dest-datalist">
                    {BENGALURU_DESTINATIONS.map((d) => (
                      <option key={d.id} value={d.name}>{d.name} ({d.type})</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Action Buttons: Route + Live Demo */}
              <div className="md:col-span-3 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isLoading || !selectedSource.trim() || !selectedDestination.trim()}
                  className="flex-1 rounded-xl py-2.5 gap-1.5 text-xs font-bold shadow-2xs border-slate-200 dark:border-white/15 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Routing..." : "Route"}</span>
                </Button>

                <Button
                  type="button"
                  variant="emerald"
                  onClick={handleStartDemo}
                  disabled={isLoading}
                  title={
                    isAutoRunning
                      ? "Pause the ambulance moving demo"
                      : "Start live demo with ambulance moving towards destination"
                  }
                  className={`flex-1 rounded-xl py-2.5 gap-1.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
                    isAutoRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  }`}
                >
                  {isAutoRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Demo</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Live Demo</span>
                    </>
                  )}
                </Button>

                {(isTripActive || isAutoRunning) && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleEndTrip}
                    className="rounded-xl py-2.5 px-3 gap-1.5 text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer shrink-0"
                    title="End active emergency corridor trip"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>End Trip</span>
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map + Presets */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-emerald-300/70 dark:border-emerald-500/30">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="emerald" className="text-[11px] font-black tracking-wide">RAPID WAY ACTIVE</Badge>
                    <Badge variant={operationMode === "live" ? "sky" : "amber"} className="text-[10px] font-bold">
                      {operationMode === "live" ? "LIVE GPS" : "DEMO MODE"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-5">
                    <div className="min-w-0"><span className="block text-[10px] font-bold uppercase text-slate-400">From</span><span className="block truncate font-semibold">{selectedSource}</span></div>
                    <div className="min-w-0"><span className="block text-[10px] font-bold uppercase text-slate-400">To</span><span className="block truncate font-semibold">{selectedDestination}</span></div>
                    <div><span className="block text-[10px] font-bold uppercase text-slate-400">Distance</span><span className="font-bold text-emerald-700 dark:text-emerald-400">{routeData?.distance_km || 0} km</span></div>
                    <div><span className="block text-[10px] font-bold uppercase text-slate-400">ETA</span><span className="font-bold text-amber-700 dark:text-amber-400">{routeData?.eta_minutes || 0} min</span></div>
                    <div><span className="block text-[10px] font-bold uppercase text-slate-400">Signals</span><span className="font-bold text-sky-700 dark:text-sky-400">{routeData?.traffic_signals?.length || 0} on route</span></div>
                  </div>
                  {gpsError && <p className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">{gpsError}</p>}
                </div>
                {operationMode === "demo" && routeData?.route?.length > 0 && (
                  <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[230px] sm:justify-end">
                    <Button type="button" variant="emerald" onClick={() => handleStartDemo()} disabled={isLoading} className="rounded-lg gap-1.5 text-xs">
                      {isAutoRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {isAutoRunning ? "Pause" : "Start"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handleStartDemo(true)} disabled={isLoading} title="Restart demo" className="rounded-lg gap-1.5 text-xs">
                      <RotateCcw className="h-3.5 w-3.5" /> Restart
                    </Button>
                    <Button type="button" variant="outline" onClick={handleStopDemo} disabled={!isAutoRunning && !isTripActive} title="Stop demo" className="rounded-lg gap-1.5 text-xs text-rose-600 hover:text-rose-700">
                      <Square className="h-3.5 w-3.5 fill-current" /> Stop
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div ref={mapSectionRef} className="scroll-mt-24">
            <InteractiveMap
              routeCoordinates={routeData?.route || []}
              trafficSignals={routeData?.traffic_signals || []}
              signalStates={routeData?.signal_states || []}
              activeSignalIndex={activeSignalIndex}
              ambulancePosition={ambulancePos}
              source={sourceCoords}
              destination={destCoords}
              sourceName={selectedSource || "Emergency Origin"}
              destName={selectedDestination || "Trauma Hospital Center"}
              distanceKm={routeData?.distance_km || 0}
              etaMinutes={routeData?.eta_minutes || 0}
              steps={routeData?.steps || []}
              dataSource={routeData?.data_source}
              currentStreet={currentStreet}
              nextManeuver={nextManeuver}
              speedKmH={currentSpeed}
              onSignalOverride={handleSignalOverride}
              isAutoRunning={isAutoRunning}
              height="540px"
            />
          </div>

        </div>

        {/* Right Column: Live Telemetry, Controls & Feed */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <Card className="border-rose-300 bg-rose-50/40 dark:border-rose-500/40 dark:bg-rose-950/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">Location Sharing</h2>
                {locationShareStatus === "sent" && <Badge variant="emerald" className="text-[10px]">RECEIVED</Badge>}
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Emergency vehicle ID
                <input value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setTrackingMode("live")} className={`rounded-lg border px-2 py-2 text-[11px] font-extrabold transition ${trackingMode === "live" ? "border-sky-500 bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300" : "border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-950"}`}>LIVE GPS</button>
                <button type="button" onClick={() => setTrackingMode("demo")} className={`rounded-lg border-2 px-2 py-2 text-[11px] font-extrabold transition ${trackingMode === "demo" ? "border-amber-500 bg-amber-100 text-amber-900 shadow-sm dark:bg-amber-500/20 dark:text-amber-300" : "border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-950"}`}>DEMO MODE</button>
              </div>
              <Button type="button" variant="destructive" onClick={handleShareLocation} disabled={locationShareStatus === "requesting" || locationShareStatus === "sent"} className="w-full rounded-xl gap-2 font-black shadow-sm">
                <Radio className="h-4 w-4" />
                {locationShareStatus === "requesting" ? "Requesting GPS..." : locationShareStatus === "sent" ? "Location Sharing Active" : "Send Location to Traffic Control"}
              </Button>
              {sharedLocation && (
                <div className="rounded-lg border border-emerald-200 bg-white p-2 text-[10px] dark:border-emerald-500/30 dark:bg-slate-950">
                  <div className="flex items-center justify-between font-black text-emerald-700 dark:text-emerald-400"><span><span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />LIVE GPS</span><span>Updated {new Date(sharedLocation.timestamp).toLocaleTimeString()}</span></div>
                  <p className="mt-1 font-mono text-slate-600 dark:text-slate-300">{Number(sharedLocation.lat).toFixed(6)}, {Number(sharedLocation.lon).toFixed(6)} | {sharedLocation.accuracy ?? "-"}m</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Live Telemetry HUD */}
          <LiveTelemetryHUD
            distanceKm={routeData?.distance_km || 0}
            etaMinutes={routeData?.eta_minutes || 0}
            speedKmH={currentSpeed}
            totalSignals={routeData?.traffic_signals?.length || 0}
            clearedSignals={activeSignalIndex >= 0 ? activeSignalIndex + 1 : 0}
            currentStreet={currentStreet}
            nextManeuver={nextManeuver}
            nextSignal={nextSignal}
            bearing={ambulancePos?.bearing || 0}
            isRunning={isAutoRunning || currentSpeed > 0}
            rapidWayActive={Boolean(rapidWayRequest && routeData)}
          />

          {/* Dedicated Live GPS Position & Satellite Lock Card */}
          <Card className="border-emerald-500/30 dark:border-emerald-500/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-['Outfit']">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Live GPS Telemetry
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                  {isAutoRunning ? "TRACKING ACTIVE" : "DGPS READY"}
                </Badge>
              </div>

              {/* Dynamic Coordinates Stream */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">Coordinates</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate ml-2">
                  {ambulancePos
                    ? `${ambulancePos.lat.toFixed(6)}° N, ${ambulancePos.lon.toFixed(6)}° E`
                    : "12.975612° N, 77.606624° E"}
                </span>
              </div>

              {/* 3 Metrics: Compass Heading, Satellites, Precision */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold">Heading</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {ambulancePos?.bearing ? `${Math.round(ambulancePos.bearing)}°` : "0° N"}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold">Satellites</p>
                  <p className="font-bold text-sky-600 dark:text-sky-400 mt-0.5">14 NavIC</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-sans font-bold">Accuracy</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">±1.2m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Simulation Action Card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Live Corridor Control
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleStart}
                  disabled={isLoading || isAutoRunning}
                  className="flex-1 rounded-xl gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start
                </Button>

                <Button
                  variant={isAutoRunning ? "outline" : "emerald"}
                  size="sm"
                  onClick={handleAutoRun}
                  className={`flex-1 rounded-xl gap-1.5 ${
                    isAutoRunning
                      ? "bg-amber-500 text-slate-950 font-extrabold border-amber-500 shadow-md hover:bg-amber-400"
                      : ""
                  }`}
                >
                  {isAutoRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      GPS Track
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Reset Corridor"
                  className="rounded-xl border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Incident & Signal Dispatch Stream */}
          <Card className="flex-1">
            <CardContent className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Live Incident & Clearance Stream
                </h2>
                <Badge variant="sky" className="text-[10px] font-bold">Real-time</Badge>
              </div>

              <div
                tabIndex={0}
                role="log"
                aria-label="Real-time incident event log"
                className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs flex-1"
              >
                {eventLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 flex items-start gap-2 shadow-2xs"
                  >
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
                      {log.time}
                    </span>
                    <p
                      className={`text-[11px] leading-snug ${
                        log.type === "success"
                          ? "text-emerald-800 dark:text-emerald-400 font-semibold"
                          : log.type === "error"
                          ? "text-rose-700 dark:text-rose-400 font-medium"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {log.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Corridor Console Modal */}
      <CorridorConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        onRouteCalculated={handleRouteCalculated}
        onSignalUpdate={(states, idx) => {
          setActiveSignalIndex(idx);
        }}
        currentRoute={routeData}
        activeSignalIndex={activeSignalIndex}
      />

      {/* Green Corridor Official Trip Report Modal */}
      <TripReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={tripReport}
      />
      {locationShareStatus === "sent" && sharedLocation && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[70] w-[min( calc(100vw-2rem),20rem)] max-w-sm rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-2xl dark:border-emerald-500/50 dark:bg-emerald-950 dark:text-emerald-50">
          <p className="font-black">🚨 Location Sent to Traffic Control</p>
          <p className="mt-2 text-xs leading-5"><strong>Emergency Vehicle:</strong> {sharedLocation.vehicle_id}<br /><strong>Location:</strong> {Number(sharedLocation.lat).toFixed(6)}, {Number(sharedLocation.lon).toFixed(6)}<br /><strong>Accuracy:</strong> {sharedLocation.accuracy ?? "Unavailable"} meters<br /><strong>Time:</strong> {new Date(sharedLocation.timestamp).toLocaleString()}<br /><strong>Status:</strong> ✅ Successfully received by Traffic Control</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
