import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface CommitActivityChartProps {
  data: Array<{
    bucket: string;
    total: number;
    owner: number;
  }>;
  height?: number;
  showLegend?: boolean;
}

const formatBucketLabel = (bucket: string) => {
  if (!bucket) return '';
  try {
    // Handle daily format: YYYY-MM-DD
    if (bucket.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = bucket.split('-').map(part => parseInt(part, 10));
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Handle weekly format: YYYY-WW
    if (bucket.match(/^\d{4}-W\d{2}$/)) {
      const [year, weekStr] = bucket.split('-W');
      const week = parseInt(weekStr, 10);
      // Calculate approximate date from week number
      const jan1 = new Date(parseInt(year, 10), 0, 1);
      const daysOffset = (week - 1) * 7;
      const weekDate = new Date(jan1);
      weekDate.setDate(jan1.getDate() + daysOffset);
      return weekDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Handle monthly format: YYYY-MM
    const [year, month] = bucket.split('-').map(part => parseInt(part, 10));
    if (year && month) {
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
    
    return bucket;
  } catch {
    return bucket;
  }
};

/**
 * Create a smoothed path using quadratic Bezier curves
 */
const createSmoothPath = (
  points: Array<{ x: number; y: number }>,
  tension: number = 0.3
): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const prev = i > 0 ? points[i - 1] : current;
    const afterNext = i < points.length - 2 ? points[i + 2] : next;

    // Calculate control points for smooth curve
    const cp1x = current.x + (next.x - prev.x) * tension;
    const cp1y = current.y + (next.y - prev.y) * tension;
    const cp2x = next.x - (afterNext.x - current.x) * tension;
    const cp2y = next.y - (afterNext.y - current.y) * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  return path;
};

export const CommitActivityChart: React.FC<CommitActivityChartProps> = ({
  data,
  height = 200,
  showLegend = true,
}) => {
  const { theme } = useTheme();
  const [selectedPoint, setSelectedPoint] = useState<{
    x: number;
    y: number;
    bucket: string;
    owner: number;
    total: number;
    index: number;
  } | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  const gradientIdRef = useRef(`gradient-${Math.random().toString(36).substr(2, 9)}`);
  const ownerGradientId = `${gradientIdRef.current}-owner`;
  const totalGradientId = `${gradientIdRef.current}-total`;
  const screenWidth = Dimensions.get('window').width;
  const isWide = screenWidth > 980;
  // Calculate chart width to fit within the parent container
  // The parent container has maxWidth: 920 and padding: 32 (or 20 on mobile)
  // Account for the page container's padding and the section's available width
  const pageMaxWidth = 920;
  const pagePadding = isWide ? 32 : 20;
  const availableWidth = pageMaxWidth - (pagePadding * 2);
  const chartWidth = Math.min(screenWidth - (isWide ? 64 : 40), availableWidth);
  const padding = { top: 30, right: 20, bottom: 30, left: 40 }; // Increased left for y-axis label, bottom for x-axis
  const graphWidth = Math.max(0, chartWidth - padding.left - padding.right);
  const graphHeight = height - padding.top - padding.bottom;

  const chartData = useMemo(() => {
    if (data.length === 0) return { ownerPoints: [], totalPoints: [], maxValue: 1 };

    const maxValue = Math.max(...data.map(d => d.total), 1);
    const pointSpacing = graphWidth / Math.max(data.length - 1, 1);

    const ownerPoints = data.map((entry, index) => ({
      x: padding.left + index * pointSpacing,
      y: padding.top + graphHeight - (entry.owner / maxValue) * graphHeight,
      value: entry.owner,
      bucket: entry.bucket,
      total: entry.total,
      index,
    }));

    const totalPoints = data.map((entry, index) => ({
      x: padding.left + index * pointSpacing,
      y: padding.top + graphHeight - (entry.total / maxValue) * graphHeight,
      value: entry.total,
      bucket: entry.bucket,
      owner: entry.owner,
      index,
    }));

    return { ownerPoints, totalPoints, maxValue };
  }, [data, graphWidth, graphHeight, padding.left, padding.top]);

  const ownerPath = useMemo(
    () => createSmoothPath(chartData.ownerPoints.map(p => ({ x: p.x, y: p.y }))),
    [chartData.ownerPoints]
  );

  const totalPath = useMemo(
    () => createSmoothPath(chartData.totalPoints.map(p => ({ x: p.x, y: p.y }))),
    [chartData.totalPoints]
  );

  // Create area paths for gradient fill
  const ownerAreaPath = useMemo(() => {
    if (chartData.ownerPoints.length === 0) return '';
    const firstPoint = chartData.ownerPoints[0];
    const lastPoint = chartData.ownerPoints[chartData.ownerPoints.length - 1];
    const bottomY = padding.top + graphHeight;
    return `${ownerPath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
  }, [ownerPath, chartData.ownerPoints, graphHeight, padding.top]);

  const totalAreaPath = useMemo(() => {
    if (chartData.totalPoints.length === 0) return '';
    const firstPoint = chartData.totalPoints[0];
    const lastPoint = chartData.totalPoints[chartData.totalPoints.length - 1];
    const bottomY = padding.top + graphHeight;
    return `${totalPath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
  }, [totalPath, chartData.totalPoints, graphHeight, padding.top]);

  // Y-axis labels - generate nice round numbers with whole-number intervals
  const yAxisLabels = useMemo(() => {
    const maxValue = chartData.maxValue;
    if (maxValue <= 0) return [];
    
    // Nice intervals: 1, 2, 5, 10, 20, 25, 50
    const niceIntervals = [1, 2, 5, 10, 20, 25, 50];
    
    // Calculate target interval for max 6 lines
    const targetInterval = Math.ceil(maxValue / 6);
    
    // Determine the magnitude (power of 10)
    let magnitude = 1;
    if (targetInterval >= 1) {
      magnitude = Math.pow(10, Math.floor(Math.log10(targetInterval)));
    }
    
    // Scale the nice intervals by magnitude
    const scaledIntervals = niceIntervals.map(interval => interval * magnitude);
    
    // Find the best interval >= targetInterval
    let interval = scaledIntervals[scaledIntervals.length - 1]; // Default to largest
    for (const scaledInterval of scaledIntervals) {
      if (scaledInterval >= targetInterval) {
        interval = scaledInterval;
        break;
      }
    }
    
    // Calculate the max value to show (round up to next interval)
    const niceMax = Math.ceil(maxValue / interval) * interval;
    
    // Generate labels (max 6 lines)
    const labels = [];
    const maxSteps = Math.min(6, Math.ceil(niceMax / interval));
    
    for (let i = 0; i <= maxSteps; i++) {
      const value = i * interval;
      if (value <= niceMax) {
        const y = padding.top + graphHeight - (value / niceMax) * graphHeight;
        labels.push({ value, y });
      }
    }
    
    return labels;
  }, [chartData.maxValue, graphHeight, padding.top]);

  // X-axis labels and ticks
  const xAxisLabels = useMemo(() => {
    // Determine if we're dealing with daily buckets
    const isDaily = data.length > 0 && data[0].bucket.match(/^\d{4}-\d{2}-\d{2}$/);
    
    // For daily buckets, show fewer labels (every 3-4 days or so)
    // For weekly/monthly, show about 6 labels
    const maxLabels = isDaily ? Math.min(8, data.length) : 6;
    const labelInterval = Math.max(1, Math.floor(data.length / maxLabels));
    
    return data
      .map((entry, index) => ({ entry, index }))
      .filter(({ index }) => index % labelInterval === 0 || index === data.length - 1)
      .map(({ entry, index }) => ({
        x: padding.left + (index / Math.max(data.length - 1, 1)) * graphWidth,
        label: formatBucketLabel(entry.bucket),
      }));
  }, [data, graphWidth, padding.left]);

  const handlePointPress = (point: typeof chartData.ownerPoints[0] | typeof chartData.totalPoints[0], isOwner: boolean) => {
    const pointData = isOwner 
      ? { ...point, total: chartData.totalPoints[point.index]?.value || 0 }
      : { ...point, owner: chartData.ownerPoints[point.index]?.value || 0 };
    
    setSelectedPoint({
      x: point.x,
      y: point.y,
      bucket: point.bucket,
      owner: isOwner ? point.value : pointData.owner,
      total: isOwner ? pointData.total : point.value,
      index: point.index,
    });
    setTooltipVisible(true);
  };

  if (data.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: chartWidth,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 12,
      paddingBottom: 12,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    svgContainer: {
      width: '100%',
      height: height,
      position: 'relative',
    },
    labelsContainer: {
      width: '100%',
      height: 18,
      marginTop: -4, // Move labels closer to the graph
      position: 'relative',
    },
    label: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    yAxisLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    yAxisContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: padding.left - 12,
      height: height,
      paddingRight: 8,
    },
    yAxisLabelWrapper: {
      position: 'absolute',
      right: 0,
      transform: [{ translateY: -8 }], // Center the text vertically
    },
    yAxisTitle: {
      position: 'absolute',
      left: -60,
      top: height / 2 - 30,
      width: 120,
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      transform: [{ rotate: '-90deg' }],
    },
    legend: {
      flexDirection: 'row',
      gap: 18,
      marginTop: 16,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendSwatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    legendSwatchOwner: {
      backgroundColor: theme.colors.primary,
    },
    legendSwatchTotal: {
      backgroundColor: theme.colors.textSecondary,
    },
    legendText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      minWidth: 120,
    },
    tooltipTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 6,
    },
    tooltipRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    tooltipLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    tooltipValue: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
    },
    touchablePoint: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
    },
  });

  // Calculate SVG width based on container width minus padding
  const svgWidth = chartWidth - 24;

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisContainer}>
            {yAxisLabels.map((label, index) => (
              <View
                key={`y-label-wrapper-${index}`}
                style={[
                  styles.yAxisLabelWrapper,
                  {
                    top: label.y,
                  },
                ]}
              >
                <Text style={styles.yAxisLabel}>
                  {label.value % 1 === 0 ? label.value.toString() : label.value.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
          {/* Y-axis title */}
          <Text style={styles.yAxisTitle}>Commits</Text>

          <Svg width={svgWidth} height={height}>
            <Defs>
              <LinearGradient id={ownerGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.05" />
              </LinearGradient>
              <LinearGradient id={totalGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={theme.colors.textSecondary} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={theme.colors.textSecondary} stopOpacity="0.05" />
              </LinearGradient>
            </Defs>

            {/* Y-axis line */}
            <Line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + graphHeight}
              stroke={theme.colors.border}
              strokeWidth="1"
            />

            {/* X-axis line */}
            <Line
              x1={padding.left}
              y1={padding.top + graphHeight}
              x2={padding.left + graphWidth}
              y2={padding.top + graphHeight}
              stroke={theme.colors.border}
              strokeWidth="1"
            />

            {/* Grid lines (horizontal) */}
            <G stroke={theme.colors.border} strokeWidth="1" strokeDasharray="2,2" opacity={0.3}>
              {[0.25, 0.5, 0.75].map(ratio => (
                <Line
                  key={`h-grid-${ratio}`}
                  x1={padding.left}
                  y1={padding.top + ratio * graphHeight}
                  x2={padding.left + graphWidth}
                  y2={padding.top + ratio * graphHeight}
                />
              ))}
            </G>

            {/* X-axis ticks */}
            <G stroke={theme.colors.border} strokeWidth="1">
              {xAxisLabels.map((label, index) => (
                <Line
                  key={`x-tick-${index}`}
                  x1={label.x}
                  y1={padding.top + graphHeight}
                  x2={label.x}
                  y2={padding.top + graphHeight + 4}
                />
              ))}
            </G>

            {/* Area fills */}
            {ownerAreaPath && (
              <Path
                d={ownerAreaPath}
                fill={`url(#${ownerGradientId})`}
              />
            )}
            {totalAreaPath && (
              <Path
                d={totalAreaPath}
                fill={`url(#${totalGradientId})`}
              />
            )}

            {/* Lines */}
            {ownerPath && (
              <Path
                d={ownerPath}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {totalPath && (
              <Path
                d={totalPath}
                fill="none"
                stroke={theme.colors.textSecondary}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points - owner */}
            {chartData.ownerPoints.map((point, index) => (
              <Circle
                key={`owner-${index}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={theme.colors.primary}
                stroke={theme.colors.surface}
                strokeWidth="2"
              />
            ))}
            {/* Data points - total */}
            {chartData.totalPoints.map((point, index) => (
              <Circle
                key={`total-${index}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={theme.colors.textSecondary}
                stroke={theme.colors.surface}
                strokeWidth="2"
              />
            ))}
          </Svg>

          {/* Touchable overlays for data points */}
          {chartData.ownerPoints.map((point, index) => (
            <TouchableOpacity
              key={`touch-owner-${index}`}
              style={[
                styles.touchablePoint,
                {
                  left: point.x - 10 + 12, // Account for container padding
                  top: point.y - 10,
                },
              ]}
              onPress={() => handlePointPress(point, true)}
              activeOpacity={0.7}
            />
          ))}
          {chartData.totalPoints.map((point, index) => (
            <TouchableOpacity
              key={`touch-total-${index}`}
              style={[
                styles.touchablePoint,
                {
                  left: point.x - 10 + 12, // Account for container padding
                  top: point.y - 10,
                },
              ]}
              onPress={() => handlePointPress(point, false)}
              activeOpacity={0.7}
            />
          ))}

          {/* Tooltip */}
          {tooltipVisible && selectedPoint && (
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.min(
                    Math.max(selectedPoint.x - 60 + 12, 12),
                    chartWidth - 132
                  ),
                  top: Math.max(selectedPoint.y - 80, 12),
                },
              ]}
            >
              <Text style={styles.tooltipTitle}>{formatBucketLabel(selectedPoint.bucket)}</Text>
              <View style={styles.tooltipRow}>
                <Text style={[styles.tooltipLabel, { color: theme.colors.primary }]}>Your commits:</Text>
                <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
                  {selectedPoint.owner.toFixed(1)}
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Total commits:</Text>
                <Text style={[styles.tooltipValue, { color: theme.colors.textSecondary }]}>
                  {selectedPoint.total.toFixed(1)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* X-axis labels */}
        {xAxisLabels.length > 0 && (
          <View style={styles.labelsContainer}>
            {xAxisLabels.map((label, index) => (
              <View
                key={`label-wrapper-${index}`}
                style={{
                  position: 'absolute',
                  left: label.x - 25,
                  width: 50,
                  alignItems: 'center',
                }}
              >
                <Text style={styles.label}>{label.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendSwatchOwner]} />
            <Text style={styles.legendText}>Your commits</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.legendSwatchTotal]} />
            <Text style={styles.legendText}>Total commits</Text>
          </View>
        </View>
      )}

      {/* Modal overlay to dismiss tooltip */}
      {tooltipVisible && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
          }}
          activeOpacity={1}
          onPress={() => setTooltipVisible(false)}
        />
      )}
    </View>
  );
};
