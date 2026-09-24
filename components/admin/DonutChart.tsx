import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

type DonutChartProps = {
  data: Array<{
    status?: string;
    method?: string;
    count: number;
  }>;
};

const COLORS = [
  "#FE8C00", // gold
  "#7A9E7E", // green
  "#B18C55", // brown
  "#8B6F8B", // purple
  "#4A7C59", // dark green
  "#C0392B", // red
  "#D4A574", // beige
  "#2F9B65", // success
  "#E67E22", // orange
  "#2E86C1", // blue
];

const DONUT_SIZE = 120;
const STROKE_WIDTH = 20;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart = ({ data }: DonutChartProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  // Calculate stroke dasharray offsets
  let cumulativeOffset = 0;
  const segments = data.map((d, index) => {
    const percentage = d.count / total;
    const dashLength = percentage * CIRCUMFERENCE;
    const dashGap = CIRCUMFERENCE - dashLength;
    const rotation = -90;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLength;

    return {
      ...d,
      dashLength,
      dashGap,
      offset,
      percentage,
      color: COLORS[index % COLORS.length],
    };
  });

  // Legend labels
  const legendItems = data.slice(0, 4); // Show first 4 items

  return (
    <View style={styles.container}>
      {/* Donut Chart */}
      <View style={styles.chartContainer}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
          {segments.map((segment, index) => (
            <Circle
              key={index}
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              fill="transparent"
              stroke={segment.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${segment.dashLength} ${segment.dashGap}`}
              strokeDashoffset={segment.offset}
              transform="rotate(-90 60 60)"
            />
          ))}
          {/* Center text */}
          <SvgText
            x={DONUT_SIZE / 2}
            y={DONUT_SIZE / 2 - 4}
            textAnchor="middle"
            fontSize={16}
            fontWeight="600"
            fontFamily="Quicksand-Bold"
            fill="#181C2E"
          >
            {total}
          </SvgText>
          <SvgText
            x={DONUT_SIZE / 2}
            y={DONUT_SIZE / 2 + 14}
            textAnchor="middle"
            fontSize={10}
            fontFamily="Quicksand-Regular"
            fill="#9CA3AF"
          >
            Total
          </SvgText>
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS[index % COLORS.length] }]} />
            <Text style={styles.legendLabel}>
              {(item.status ?? item.method ?? "")}: {item.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  emptyContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Quicksand-Regular",
  },
  chartContainer: {
    marginBottom: 8,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
  },
});

export default DonutChart;