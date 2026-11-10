"""
===============================================================================
MOTOR DE COMPATIBILIDAD RELACIONAL Y AFINIDAD VECTORIAL
Plataforma de No-Monogamia Ética (ENM) / Swinger Colombia
===============================================================================
Autor: Científico de Datos Senior & Matemático Psicometrista
Lenguaje: Python 3 (NumPy + Type Annotations)

Este módulo implementa el motor psicométrico de decisión relacional de 5D,
evaluando la compatibilidad entre parejas y perfiles individuales.

Componentes Clave:
1. Espacio Vectorial Relacional 5D (RelationalVector).
2. Filtro Booleano de Límites Duros (Hard-Veto Engine).
3. Función de Consenso Asimétrico de Pareja con Aversión al Riesgo.
4. Métrica de Distancia Coseno Ponderada y Normalización a Afinidad [0, 1].
5. Suite de Pruebas Unitarias Integrada (3 Casos de Uso del Mundo Real).
===============================================================================
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any, Union
import numpy as np


@dataclass
class RelationalVector:
    """
    Representación vectorial de 5 dimensiones normalizadas en el rango [-1.0, 1.0]
    para perfiles de no-monogamia ética y swingers.

    Dimensiones:
    - E1: RelationalSpectrum        -> -1.0 (Soft Swap exclusivo) a +1.0 (Full Swap abierto)
    - E2: ThirdPartyOrientation     -> -1.0 (Preferencia Mujer/Unicornio) a +1.0 (Preferencia Hombre/Bull)
    - E3: PowerDynamics             -> -1.0 (Voyeurismo/Exhibicionismo) a +1.0 (Participación Igualitaria)
    - E4: EmotionalAttachment       -> -1.0 (Recreativo Puro/Sin Afecto) a +1.0 (Poliamoroso/Romántico)
    - E5: BoundaryFlexibility       -> -1.0 (Reglas Rígidas/Protocolo Estricto) a +1.0 (Improvisación Fluida)
    """
    e1_relational_spectrum: float = 0.0
    e2_third_party_orientation: float = 0.0
    e3_power_dynamics: float = 0.0
    e4_emotional_attachment: float = 0.0
    e5_boundary_flexibility: float = 0.0

    def __post_init__(self) -> None:
        """Garantiza la normalización estricta en el hipercubo [-1.0, 1.0]^5."""
        self.e1_relational_spectrum = float(np.clip(self.e1_relational_spectrum, -1.0, 1.0))
        self.e2_third_party_orientation = float(np.clip(self.e2_third_party_orientation, -1.0, 1.0))
        self.e3_power_dynamics = float(np.clip(self.e3_power_dynamics, -1.0, 1.0))
        self.e4_emotional_attachment = float(np.clip(self.e4_emotional_attachment, -1.0, 1.0))
        self.e5_boundary_flexibility = float(np.clip(self.e5_boundary_flexibility, -1.0, 1.0))

    def to_numpy(self) -> np.ndarray:
        """
        Exporta los ejes a un arreglo unidimensional de NumPy de tamaño (5,).
        
        Returns:
            np.ndarray: Vector de forma (5,) en float64.
        """
        return np.array([
            self.e1_relational_spectrum,
            self.e2_third_party_orientation,
            self.e3_power_dynamics,
            self.e4_emotional_attachment,
            self.e5_boundary_flexibility
        ], dtype=np.float64)

    @classmethod
    def from_numpy(cls, arr: np.ndarray) -> 'RelationalVector':
        """Construye una instancia a partir de un arreglo de 5 elementos."""
        arr_clipped = np.clip(arr, -1.0, 1.0)
        return cls(
            e1_relational_spectrum=float(arr_clipped[0]),
            e2_third_party_orientation=float(arr_clipped[1]),
            e3_power_dynamics=float(arr_clipped[2]),
            e4_emotional_attachment=float(arr_clipped[3]),
            e5_boundary_flexibility=float(arr_clipped[4])
        )


def evaluate_hard_vetoes(
    vetoes_party_a: Dict[str, bool],
    practices_party_b: Dict[str, bool],
    vetoes_party_b: Optional[Dict[str, bool]] = None,
    practices_party_a: Optional[Dict[str, bool]] = None
) -> Tuple[bool, List[str]]:
    """
    Filtro Booleano de Límites Duros (Hard-Veto Engine).

    Modela la teoría de restricciones no negociables en dinámica relacional.
    Evalúa colisiones directas entre los vetos categóricos de una parte
    y las prácticas manifestadas o requeridas por la otra parte.

    Reglas de veto predefinidas:
    - 'no_men': Incompatible con presencia activa masculina / solo men / bulls.
    - 'condom_mandatory': Incompatible con requisito sin preservativo ('bareback' / 'no_condom').
    - 'no_home_visits': Incompatible con requisito de citas en casa ('home_visits_only').
    - 'no_penetration': Incompatible con penetración obligatoria ('penetration_required' / 'full_swap_required').
    - 'no_single_men': Incompatible con hombres solos ('is_single_man').
    - 'no_single_women': Incompatible con mujeres solas ('is_single_woman').
    - 'no_emotional_bonding': Incompatible con pretensión romántica ('requires_romantic_bond').

    Args:
        vetoes_party_a: Diccionario de vetos innegociables de la Parte A.
        practices_party_b: Diccionario de prácticas de la Parte B.
        vetoes_party_b: Diccionario opcional de vetos innegociables de la Parte B.
        practices_party_a: Diccionario opcional de prácticas de la Parte A.

    Returns:
        Tuple[bool, List[str]]: (is_vetoed, list_of_veto_reasons)
    """
    reasons: List[str] = []
    
    # Mapeos de colisión categórica (Veto -> Práctica incompatible)
    collision_matrix = {
        'no_men': [
            ('has_male_partner', "Incompatibilidad de género: La Parte A tiene el veto estricto 'no_men' y la Parte B incluye interacción masculina."),
            ('is_single_man', "Incompatibilidad de género: La Parte A veta interacción con hombres solos y la Parte B es un hombre solo."),
            ('seeking_male_interaction', "Incompatibilidad de género: La Parte B exige interacción masculina que la Parte A prohíbe.")
        ],
        'condom_mandatory': [
            ('no_condoms', "Seguridad sexual: La Parte A exige uso obligatorio de preservativo y la Parte B practica sexo sin preservativo."),
            ('bareback_required', "Seguridad sexual: La Parte B exige encuentros sin preservativo, violando el límite estricto de la Parte A.")
        ],
        'no_home_visits': [
            ('home_visits_only', "Logística: La Parte A rechaza visitas domiciliarias y la Parte B requiere exclusivamente encuentros en casa.")
        ],
        'no_penetration': [
            ('penetration_required', "Nivel de intercambio: La Parte A veta la penetración (Soft Swap puro) y la Parte B requiere penetración obligatoria."),
            ('full_swap_mandatory', "Nivel de intercambio: La Parte A sólo acepta Soft Swap y la Parte B exige Full Swap obligatorio.")
        ],
        'no_single_men': [
            ('is_single_man', "Tipo de perfil: La Parte A rechaza hombres solos y la Parte B es un hombre solo (Bull).")
        ],
        'no_single_women': [
            ('is_single_woman', "Tipo de perfil: La Parte A rechaza mujeres solas y la Parte B es una mujer sola (Unicornio).")
        ],
        'no_emotional_bonding': [
            ('requires_romantic_bond', "Enfoque emocional: La Parte A busca encuentros recreativos puros y la Parte B exige vínculo romántico/poliamoroso.")
        ]
    }

    # Evaluar Dirección A -> B
    if vetoes_party_a and practices_party_b:
        for veto_key, is_active in vetoes_party_a.items():
            if is_active and veto_key in collision_matrix:
                for practice_key, message in collision_matrix[veto_key]:
                    if practices_party_b.get(practice_key, False):
                        reasons.append(message)

    # Evaluar Dirección B -> A (si se suministran datos)
    if vetoes_party_b and practices_party_a:
        for veto_key, is_active in vetoes_party_b.items():
            if is_active and veto_key in collision_matrix:
                for practice_key, message in collision_matrix[veto_key]:
                    if practices_party_a.get(practice_key, False):
                        reasons.append(f"Veto cruzado (Parte B): {message}")

    is_vetoed = len(reasons) > 0
    return is_vetoed, reasons


def compute_couple_consensus(
    vector_a: Union[np.ndarray, RelationalVector],
    vector_b: Union[np.ndarray, RelationalVector],
    risk_aversion: float = 0.65
) -> np.ndarray:
    """
    Función de Consenso de Pareja con Aversión al Riesgo.

    Dado que un promedio aritmético simple ((A + B) / 2) diluye e ignora la
    incomodidad del miembro más estricto o conservador de la pareja, esta función
    aplica una ponderación asimétrica que desplaza la posición de consenso hacia
    el "ancla de menor exposición o mayor precaución".

    Modelo Matemático:
        Sean vA y vB los vectores de 5 dimensiones.
        Para cada dimensión i:
            mean_i = (vA_i + vB_i) / 2
            strict_anchor_i = min(vA_i, vB_i)
            consensus_i = (1 - risk_aversion) * mean_i + risk_aversion * strict_anchor_i

    Propiedades Matemáticas:
    - Si risk_aversion = 0.0: Equivale al promedio aritmético simple.
    - Si risk_aversion = 1.0: Adopta estrictamente el límite del miembro más conservador.
    - Con risk_aversion = 0.65 (predeterminado): Garantiza la protección del confort
      de la parte con mayor aversión o restricción, previniendo el descontrol relacional.

    Args:
        vector_a: Vector 5D del Miembro A (RelationalVector o np.ndarray).
        vector_b: Vector 5D del Miembro B (RelationalVector o np.ndarray).
        risk_aversion: Coeficiente en el intervalo [0.0, 1.0]. Defecto: 0.65.

    Returns:
        np.ndarray: Vector de consenso de 5D en el rango [-1.0, 1.0].
    """
    v_a = vector_a.to_numpy() if isinstance(vector_a, RelationalVector) else np.asarray(vector_a, dtype=np.float64)
    v_b = vector_b.to_numpy() if isinstance(vector_b, RelationalVector) else np.asarray(vector_b, dtype=np.float64)

    risk_aversion = float(np.clip(risk_aversion, 0.0, 1.0))

    # Promedio aritmético base
    arithmetic_mean = (v_a + v_b) / 2.0

    # Ancla conservadora por dimensión (mínimo valor = menor exposición a riesgo/apertura)
    conservative_anchor = np.minimum(v_a, v_b)

    # Combinación convexa ponderada por aversión al riesgo
    consensus = (1.0 - risk_aversion) * arithmetic_mean + risk_aversion * conservative_anchor

    return np.clip(consensus, -1.0, 1.0)


def calculate_affinity_score(
    consensus_vector: Union[np.ndarray, RelationalVector],
    target_vector: Union[np.ndarray, RelationalVector],
    weights: Optional[Union[np.ndarray, List[float]]] = None
) -> float:
    """
    Distancia Coseno Ponderada y Normalización a Índice de Afinidad Relacional.

    Mide la similitud angular entre el vector de consenso de la pareja y el vector
    del perfil objetivo (otra pareja o persona sola), aplicando ponderación por dimensión.

    Fórmula:
        Similitud Coseno Ponderada:
        cos_sim_w = sum(w_i * u_i * v_i) / ( sqrt(sum(w_i * u_i^2)) * sqrt(sum(w_i * v_i^2)) )

        Transformación de [-1.0, 1.0] a Escalar Normalizado [0.0, 1.0]:
        affinity_score = (cos_sim_w + 1.0) / 2.0

    Args:
        consensus_vector: Vector 5D de consenso (o sujeto A).
        target_vector: Vector 5D del objetivo (sujeto B / pareja objetivo).
        weights: Pesos opcionales para las 5 dimensiones. Si es None, usa [1, 1, 1, 1, 1].

    Returns:
        float: Puntaje de afinidad escalar en [0.0, 1.0] (0% a 100%).
    """
    u = consensus_vector.to_numpy() if isinstance(consensus_vector, RelationalVector) else np.asarray(consensus_vector, dtype=np.float64)
    v = target_vector.to_numpy() if isinstance(target_vector, RelationalVector) else np.asarray(target_vector, dtype=np.float64)

    if weights is None:
        w = np.ones(5, dtype=np.float64)
    else:
        w = np.asarray(weights, dtype=np.float64)
        if w.shape != (5,):
            raise ValueError("El vector de pesos debe ser de dimensión (5,).")

    # Producto escalar ponderado
    dot_product = np.sum(w * u * v)

    # Normas ponderadas de los vectores
    norm_u = np.sqrt(np.sum(w * (u ** 2)))
    norm_v = np.sqrt(np.sum(w * (v ** 2)))

    # Prevención de división por cero
    denominator = norm_u * norm_v
    if denominator < 1e-9:
        return 0.0

    # Similitud coseno en [-1.0, 1.0]
    cosine_sim = dot_product / denominator
    cosine_sim = float(np.clip(cosine_sim, -1.0, 1.0))

    # Normalización lineal al intervalo [0.0, 1.0]
    affinity_score = (cosine_sim + 1.0) / 2.0

    return float(np.clip(affinity_score, 0.0, 1.0))


def evaluate_relational_compatibility(
    profile_a_member_1: RelationalVector,
    profile_a_member_2: Optional[RelationalVector],
    profile_b_member_1: RelationalVector,
    profile_b_member_2: Optional[RelationalVector],
    vetoes_a: Dict[str, bool],
    practices_b: Dict[str, bool],
    vetoes_b: Optional[Dict[str, bool]] = None,
    practices_a: Optional[Dict[str, bool]] = None,
    risk_aversion: float = 0.65,
    dimension_weights: Optional[List[float]] = None
) -> Dict[str, Any]:
    """
    Motor Integrado de Evaluación de Compatibilidad Relacional.

    Ejecuta el pipeline completo de decisión:
    1. Evaluación inmediata de Filtro Booleano (Hard-Veto Engine).
       Si hay colisión, omite el cálculo vectorial y retorna score 0.0.
    2. Cómputo de vectores de consenso si son parejas.
    3. Cálculo de Distancia Coseno Ponderada.
    4. Generación de reporte completo listo para producción.
    """
    # Paso 1: Hard-Veto Engine
    is_vetoed, veto_reasons = evaluate_hard_vetoes(
        vetoes_party_a=vetoes_a,
        practices_party_b=practices_b,
        vetoes_party_b=vetoes_b,
        practices_party_a=practices_a
    )

    if is_vetoed:
        return {
            "status": "VETOED",
            "affinity_score": 0.0,
            "affinity_percentage": "0.0%",
            "is_vetoed": True,
            "veto_reasons": veto_reasons,
            "consensus_vector_a": None,
            "consensus_vector_b": None,
            "message": "Compatibilidad anulada por colisión directa en límites innegociables."
        }

    # Paso 2: Consenso de Pareja A
    if profile_a_member_2 is not None:
        vector_a = compute_couple_consensus(profile_a_member_1, profile_a_member_2, risk_aversion)
    else:
        vector_a = profile_a_member_1.to_numpy()

    # Consenso de Pareja B
    if profile_b_member_2 is not None:
        vector_b = compute_couple_consensus(profile_b_member_1, profile_b_member_2, risk_aversion)
    else:
        vector_b = profile_b_member_1.to_numpy()

    # Paso 3: Afinidad Coseno Ponderada
    affinity = calculate_affinity_score(vector_a, vector_b, weights=dimension_weights)

    return {
        "status": "MATCH" if affinity >= 0.70 else "LOW_AFFINITY",
        "affinity_score": round(affinity, 4),
        "affinity_percentage": f"{round(affinity * 100, 2)}%",
        "is_vetoed": False,
        "veto_reasons": [],
        "consensus_vector_a": np.round(vector_a, 3).tolist(),
        "consensus_vector_b": np.round(vector_b, 3).tolist(),
        "message": f"Evaluación exitosa. Afinidad vectorial: {round(affinity * 100, 1)}%"
    }


# =============================================================================
# SUITE DE PRUEBAS UNITARIAS INTEGRADA
# =============================================================================
if __name__ == '__main__':
    print("=" * 80)
    print("EJECUTANDO SUITE DE PRUEBAS UNITARIAS DEL MOTOR DE COMPATIBILIDAD RELACIONAL")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # CASO 1: Pareja conservadora en Soft Swap cruzada con Hombre Solo (Bull agresivo)
    # Resultado Esperado: Veto directo (Score = 0.0) debido al filtro de límites duros.
    # -------------------------------------------------------------------------
    print("\n--- CASO DE PRUEBA 1: Pareja Conservadora (Soft Swap) vs Hombre Solo (Bull Agresivo) ---")

    # Pareja Conservadora (Soft Swap, orientada a mujeres solas / voyeurismo)
    pareja_1_m1 = RelationalVector(e1_relational_spectrum=-0.8, e2_third_party_orientation=-0.9, e3_power_dynamics=-0.5, e4_emotional_attachment=-0.8, e5_boundary_flexibility=-0.9)
    pareja_1_m2 = RelationalVector(e1_relational_spectrum=-0.9, e2_third_party_orientation=-0.8, e3_power_dynamics=-0.6, e4_emotional_attachment=-0.9, e5_boundary_flexibility=-1.0)
    vetoes_pareja_1 = {
        "no_men": True,
        "no_penetration": True,
        "condom_mandatory": True
    }
    practicas_pareja_1 = {
        "has_male_partner": True,
        "no_condoms": False
    }

    # Hombre Solo (Bull Agresivo que exige Full Swap y penetración)
    bull_solo_m1 = RelationalVector(e1_relational_spectrum=0.9, e2_third_party_orientation=1.0, e3_power_dynamics=0.8, e4_emotional_attachment=-0.5, e5_boundary_flexibility=0.8)
    practicas_bull_solo = {
        "is_single_man": True,
        "seeking_male_interaction": True,
        "penetration_required": True,
        "full_swap_mandatory": True
    }
    vetoes_bull_solo = {}

    resultado_caso_1 = evaluate_relational_compatibility(
        profile_a_member_1=pareja_1_m1,
        profile_a_member_2=pareja_1_m2,
        profile_b_member_1=bull_solo_m1,
        profile_b_member_2=None,
        vetoes_a=vetoes_pareja_1,
        practices_b=practicas_bull_solo,
        vetoes_b=vetoes_bull_solo,
        practices_a=practicas_pareja_1
    )

    print(f"Estado: {resultado_caso_1['status']}")
    print(f"Afinidad Obtención: {resultado_caso_1['affinity_percentage']}")
    print(f"¿Fue Veto?: {resultado_caso_1['is_vetoed']}")
    print("Motivos del Veto:")
    for reason in resultado_caso_1['veto_reasons']:
        print(f"  ❌ {reason}")

    assert resultado_caso_1['is_vetoed'] is True, "Caso 1 Falló: Debería ser Veto estricto."
    assert resultado_caso_1['affinity_score'] == 0.0, "Caso 1 Falló: El puntaje debe ser exactamente 0.0."
    print("✅ CASO 1 PASÓ SATISFACTORIAMENTE.")

    # -------------------------------------------------------------------------
    # CASO 2: Pareja abierta equilibrada cruzada con Mujer Sola (Unicornio simétrica)
    # Resultado Esperado: Afinidad Alta (> 0.85).
    # -------------------------------------------------------------------------
    print("\n--- CASO DE PRUEBA 2: Pareja Abierta Equilibrada vs Mujer Sola (Unicornio Simétrica) ---")

    # Pareja Abierta Equilibrada
    pareja_2_m1 = RelationalVector(e1_relational_spectrum=0.5, e2_third_party_orientation=-0.8, e3_power_dynamics=0.3, e4_emotional_attachment=-0.2, e5_boundary_flexibility=0.6)
    pareja_2_m2 = RelationalVector(e1_relational_spectrum=0.6, e2_third_party_orientation=-0.9, e3_power_dynamics=0.2, e4_emotional_attachment=-0.1, e5_boundary_flexibility=0.7)
    vetoes_pareja_2 = {"condom_mandatory": True}
    practicas_pareja_2 = {"has_male_partner": True}

    # Mujer Sola (Unicornio simétrica en sintonía)
    unicornio_m1 = RelationalVector(e1_relational_spectrum=0.6, e2_third_party_orientation=-0.9, e3_power_dynamics=0.3, e4_emotional_attachment=-0.2, e5_boundary_flexibility=0.7)
    practicas_unicornio = {"is_single_woman": True, "no_condoms": False}
    vetoes_unicornio = {"no_men": False}

    resultado_caso_2 = evaluate_relational_compatibility(
        profile_a_member_1=pareja_2_m1,
        profile_a_member_2=pareja_2_m2,
        profile_b_member_1=unicornio_m1,
        profile_b_member_2=None,
        vetoes_a=vetoes_pareja_2,
        practices_b=practicas_unicornio,
        vetoes_b=vetoes_unicornio,
        practices_a=practicas_pareja_2
    )

    print(f"Estado: {resultado_caso_2['status']}")
    print(f"Afinidad Obtención: {resultado_caso_2['affinity_percentage']}")
    print(f"¿Fue Veto?: {resultado_caso_2['is_vetoed']}")
    print(f"Vector Consenso Pareja: {resultado_caso_2['consensus_vector_a']}")

    assert resultado_caso_2['is_vetoed'] is False, "Caso 2 Falló: No debe ser Veto."
    assert resultado_caso_2['affinity_score'] > 0.85, f"Caso 2 Falló: Afinidad {resultado_caso_2['affinity_score']} no es > 0.85."
    print("✅ CASO 2 PASÓ SATISFACTORIAMENTE.")

    # -------------------------------------------------------------------------
    # CASO 3: Evaluación de la Función de Consenso con Asimetría de Límites
    # Miembro A estricto (-0.9) vs Miembro B flexible (+0.9).
    # Resultado Esperado: El consenso debe proteger al Miembro A stay en rango conservador.
    # -------------------------------------------------------------------------
    print("\n--- CASO DE PRUEBA 3: Evaluación de Consenso con Asimetría de Límites ---")

    # Miembro A estricto en E1 (Soft Swap estricto)
    m_a_estricto = RelationalVector(e1_relational_spectrum=-0.9, e2_third_party_orientation=-0.5, e3_power_dynamics=-0.5, e4_emotional_attachment=-0.5, e5_boundary_flexibility=-0.9)
    # Miembro B totalmente flexible en E1 (Full Swap abierto)
    m_b_flexible = RelationalVector(e1_relational_spectrum=0.9, e2_third_party_orientation=-0.5, e3_power_dynamics=-0.5, e4_emotional_attachment=-0.5, e5_boundary_flexibility=0.9)

    # Cálculo de consenso con risk_aversion = 0.65
    vector_consenso = compute_couple_consensus(m_a_estricto, m_b_flexible, risk_aversion=0.65)
    e1_consenso = vector_consenso[0]

    # Promedio aritmético simple sería ( -0.9 + 0.9 ) / 2 = 0.0 (Falso neutral)
    # Con aversión al riesgo 0.65:
    # 0.35 * (0.0) + 0.65 * (-0.9) = -0.585
    promedio_simple = (m_a_estricto.e1_relational_spectrum + m_b_flexible.e1_relational_spectrum) / 2.0

    print(f"E1 Miembro A (Estricto): {m_a_estricto.e1_relational_spectrum}")
    print(f"E1 Miembro B (Flexible): {m_b_flexible.e1_relational_spectrum}")
    print(f"Promedio Aritmético Simple (Engañoso): {promedio_simple}")
    print(f"Consenso Ponderado con Aversión al Riesgo (0.65): {round(e1_consenso, 4)}")

    assert e1_consenso < -0.40, f"Caso 3 Falló: El consenso ({e1_consenso}) debió priorizar la protección del Miembro A."
    print("✅ CASO 3 PASÓ SATISFACTORIAMENTE.")

    print("\n" + "=" * 80)
    print("🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE CON CERO ERRORES.")
    print("=" * 80)
