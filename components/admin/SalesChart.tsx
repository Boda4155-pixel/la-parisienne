import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Line,
  Circle,
  Text as SvgText,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 64, 500);
const CHART_HEIGHT = 200;
const PADDING = 40;

type SalesChartProps = {
  data: Array<{ date: string; revenue: number }>;
};

const SalesChart = ({ data }: SalesChartProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No sales data available</Text>
      </View>
    );
  }

  // Calculate scales
  const revenues = data.map((d) => d.revenue);
  const minRevenue = Math.min(...revenues, 0);
  const maxRevenue = Math.max(...revenues);
  const revenueRange = maxRevenue - minRevenue || 1;

  const xScale = (index: number) => PADDING + (index / (data.length - 1 || 1)) * (CHART_WIDTH - 2 * PADDING);
  const yScale = (revenue: number) => CHART_HEIGHT - PADDING - ((revenue - minRevenue) / revenueRange) * (CHART_HEIGHT - 2 * PADDING);

  // Points for the line
  const points = data.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`).join(" ");

  // Points for area fill
  const areaPoints = [
    ...data.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`),
    `${xScale(data.length - 1)},${CHART_HEIGHT - PADDING}`,
    `${xScale(0)},${CHART_HEIGHT - PADDING}`,
  ].join(" ");

  // X-axis labels (show every Nth label)
  const xLabels = data.length <= 10 ? data : data.filter((_, i) => i % Math.ceil(data.length / 8) === 0);

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        {/* Gradient for area */}
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FE8C00" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#FE8C00" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <Path
          d={Array.from({ length: 5 }, (_, i) =>
            `M ${PADDING} ${PADDING + i * ((CHART_HEIGHT - 2 * PADDING) / 4)} H ${CHART_WIDTH - PADDING}`
          ).join(" ")}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Area fill */}
        <Path
          d={`M ${areaPoints} Z`}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <Path
          d={`M ${points}`}
          stroke="#FE8C00"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <Circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.revenue)}
            r={4}
            fill="#FE8C00"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        ))}

        {/* X-axis labels */}
        {xLabels.map((d, i) => (
          <SvgText
            key={i}
            x={xScale(data.indexOf(d))}
            y={CHART_HEIGHT - PADDING + 16}
            textAnchor="middle"
            fontSize={10}
            fill="#9CA3AF"
            fontFamily="Quicksand-Regular"
          >
            {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </SvgText>
        ))}
      </Svg>

      {/* Legend/Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>
            {data.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()} EGP
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg/Day</Text>
          <Text style={styles.statValue}>
            {(data.reduce((sum, d) => sum + d.revenue, 0) / data.length).toFixed(0)} EGP
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Best Day</Text>
          <Text style={styles.statValue}>
            {Math.max(...revenues).toLocaleString()} EGP
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  emptyContainer: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Quicksand-Regular",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: CHART_WIDTH,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Quicksand-Medium",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 2,
  },
});

export default SalesChart;